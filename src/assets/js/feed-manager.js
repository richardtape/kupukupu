/**
 * Feed Manager Module
 *
 * Manages the fetching, processing, and storage of RSS/Atom feeds in KupuKupu.
 * This module is responsible for:
 * - Fetching feeds from remote sources
 * - Parsing RSS and Atom feed formats
 * - Managing feed items storage and deduplication
 * - Tracking read state of items
 * - Handling background fetching and updates
 * - Managing error states and retries
 *
 * The feed manager is implemented as a singleton to ensure consistent state
 * across the application. It works in both web and desktop environments,
 * using appropriate APIs for each platform.
 *
 * @module feed-manager
 */

import { storage } from './storage.js';
import { pubsub } from './pubsub.js';
import { settingsManager } from './settings-manager.js';
import { createHash } from '../../utils/hash.js';
import { shortcuts } from './shortcuts.js';
import { isElectron } from '../../utils/index.js';
import { getServerUrl } from '../../utils/config.js';

// Configuration constants
const FETCH_CONCURRENCY = 10;          // Maximum number of concurrent feed fetches
const DEFAULT_FETCH_INTERVAL = 60 * 60 * 1000; // 60 minutes between feed updates
const MAX_RETRIES = 3;                 // Maximum number of retry attempts for failed fetches
const ITEMS_PER_FEED = 10;             // Maximum number of items to keep per feed
const PRELOAD_THRESHOLD = 5;           // Number of items from bottom to trigger preload
const PRELOAD_AMOUNT = 10;             // Number of items to preload
const INITIAL_LOAD_AMOUNT = 20;        // Number of items to load on initial page load
const HISTORY_RETENTION_DAYS = 365;    // Number of days to retain feed history

/**
 * Fetches a feed URL using the appropriate method for the current environment.
 * In web environment, uses the fetch API through a proxy server.
 * In desktop environment, uses direct fetch through the main process.
 *
 * @async
 * @param {string} url - The URL of the feed to fetch
 * @returns {Promise<string>} The raw feed content as text
 * @throws {Error} If the fetch fails or returns an error status
 */
async function fetchUrl(url) {
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/api/feed/fetch?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch feed');
    }

    return data.data;
}

/**
 * Escapes special XML characters in a string to prevent parsing errors.
 *
 * @param {string} unsafe - The string containing potentially unsafe characters
 * @returns {string} The escaped string safe for XML parsing
 */
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
}

/**
 * FeedManager class handles all feed-related operations in KupuKupu.
 * It manages the lifecycle of feeds from fetching to display, including:
 * - Feed initialization and configuration
 * - Periodic background fetching
 * - Feed processing and storage
 * - Item deduplication and sorting
 * - Read state management
 * - Error handling and recovery
 */
export class FeedManager {
    constructor() {
        // Map of feed ID to feed object containing metadata and status
        this.feeds = new Map();
        // Queue of feeds waiting to be fetched
        this.fetchQueue = [];
        // Number of currently active fetch operations
        this.activeFetches = 0;
        // Whether the feed manager has been initialized
        this.initialized = false;
        // Array of all loaded feed items for display
        this.loadedItems = [];
        // Current index in the loaded items array for infinite scroll
        this.currentIndex = 0;
    }

    /**
     * Initializes the feed manager, loading saved feeds and starting background fetching.
     * This method should be called once when the application starts.
     *
     * @async
     * @throws {Error} If initialization fails
     */
    async initialize() {
        if (this.initialized) return;

        try {
            console.log('Initializing feed manager...');

            // Load feeds from storage via settings
            const settings = await settingsManager.loadSettings();
            console.log('Loaded settings:', settings);

            if (!settings.rssFeeds || settings.rssFeeds.length === 0) {
                console.log('No RSS feeds configured');
                pubsub.emit('newFeedItems', { count: 0 }); // Hide loading indicator
                return;
            }

            // Convert feeds array to Map with additional metadata
            this.feeds = new Map(
                settings.rssFeeds.map(feed => [
                    feed.id,
                    {
                        ...feed,
                        lastFetchTime: 0,
                        errorCount: 0,
                        status: 'active'
                    }
                ])
            );
            console.log('Initialized feeds:', this.feeds);

            // Start background fetching
            this.startBackgroundFetching();

            // Set up event listeners
            this.setupEventListeners();

            this.initialized = true;

            // Initial feed fetch
            console.log('Starting initial feed fetch...');
            await this.fetchAllFeeds();

            // Load initial items
            await this.loadInitialItems();
        } catch (error) {
            console.error('Failed to initialize feed manager:', error);
            pubsub.emit('newFeedItems', { count: 0 }); // Hide loading indicator
            throw error;
        }
    }

    /**
     * Sets up event listeners for feed-related events.
     * Handles settings changes, read state updates, and scroll events.
     *
     * @private
     */
    setupEventListeners() {
        // Listen for settings changes to update feeds
        pubsub.on('savedSettings', async (settings) => {
            await this.updateFeeds(settings.rssFeeds);
        });

        // Listen for feed item read events
        pubsub.on('feedItemRead', async ({ id }) => {
            console.log('feedItemRead received', { id });
            await this.markItemAsRead(id);
        });

        // Listen for refresh feeds event
        pubsub.on('refreshFeeds', async () => {
            console.log( 'Refreshing Feeds. refreshFeeds event received' );
            await this.fetchAllFeeds();
        });

        // Listen for scroll events to handle infinite scroll
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', this.handleScroll.bind(this));
        }
    }

    /**
     * Updates the list of feeds from settings.
     * Preserves existing feed metadata when updating.
     * Cleans up stored items for removed feeds.
     *
     * @async
     * @param {Array<Object>} newFeeds - Array of feed objects from settings
     */
    async updateFeeds(newFeeds) {
        console.warn('UPDATING FEEDS');
        console.warn('newFeeds', newFeeds);
        const feedsMap = new Map();

        // Create maps for old and new feed data
        const oldFeedsByUrl = new Map();
        const oldFeedIds = new Set();

        // Map old feeds by URL and collect old IDs
        for (const [id, feed] of this.feeds.entries()) {
            oldFeedsByUrl.set(feed.url, { id, feed });
            oldFeedIds.add(id);
        }

        // Track which new IDs we'll be using
        const newFeedIds = new Set();

        // Process each new feed
        for (const feed of newFeeds) {
            const oldFeed = oldFeedsByUrl.get(feed.url);
            const newId = feed.id;
            newFeedIds.add(newId);

            // If this feed existed before but with a different ID, migrate its data
            if (oldFeed && oldFeed.id !== newId) {
                console.log(`Migrating feed data from ${oldFeed.id} to ${newId}`);
                const items = await storage.get(`feed_items_${oldFeed.id}`) || [];
                const hashes = await storage.get(`seen_hashes_${oldFeed.id}`) || [];

                // Store items under new ID
                await storage.set(`feed_items_${newId}`, items);
                await storage.set(`seen_hashes_${newId}`, hashes);

                // Delete old data
                await storage.delete(`feed_items_${oldFeed.id}`);
                await storage.delete(`seen_hashes_${oldFeed.id}`);
            }

            // Update feeds map with new/existing feed data
            feedsMap.set(newId, {
                ...feed,
                lastFetchTime: oldFeed?.feed?.lastFetchTime || 0,
                errorCount: oldFeed?.feed?.errorCount || 0,
                status: oldFeed?.feed?.status || 'active'
            });
        }

        // Find and clean up feeds that were removed
        const removedFeedIds = Array.from(oldFeedIds).filter(id => !newFeedIds.has(id));
        for (const feedId of removedFeedIds) {
            console.log(`Cleaning up stored items for removed feed: ${feedId}`);
            await storage.delete(`feed_items_${feedId}`);
            await storage.delete(`seen_hashes_${feedId}`);
        }

        this.feeds = feedsMap;
        await this.saveFeeds();
        await this.fetchAllFeeds();
    }

    /**
     * Saves the current state of feeds to storage.
     *
     * @async
     * @private
     */
    async saveFeeds() {
        await storage.set('feeds', Object.fromEntries(this.feeds));
    }

    /**
     * Starts the background fetching interval.
     * Fetches all feeds periodically based on DEFAULT_FETCH_INTERVAL.
     *
     * @private
     */
    startBackgroundFetching() {
        setInterval(() => {
            this.fetchAllFeeds();
        }, DEFAULT_FETCH_INTERVAL);
    }

    /**
     * Initiates fetching of all active feeds.
     * Feeds are added to a queue and processed with concurrency limits.
     *
     * @async
     */
    async fetchAllFeeds() {
        this.fetchQueue = Array.from(this.feeds.values())
            .filter(feed => feed.status === 'active')
            .map(feed => ({
                ...feed,
                retryCount: 0
            }));

        await this.processFetchQueue();
    }

    /**
     * Processes the fetch queue while respecting concurrency limits.
     * Feeds are fetched in parallel up to FETCH_CONCURRENCY limit.
     *
     * @async
     * @private
     */
    async processFetchQueue() {
        while (this.fetchQueue.length > 0 && this.activeFetches < FETCH_CONCURRENCY) {
            const feed = this.fetchQueue.shift();
            this.activeFetches++;

            this.fetchFeed(feed).finally(() => {
                this.activeFetches--;
                this.processFetchQueue();
            });
        }
    }

    /**
     * Fetches and processes a single feed.
     * Handles fetch errors and implements retry logic.
     *
     * @async
     * @private
     * @param {Object} feed - The feed object to fetch
     */
    async fetchFeed(feed) {
        console.log(`Fetching feed: ${feed.url}`);
        try {
            // Fetch and parse feed content
            const text = await fetchUrl(feed.url);
            console.log(`Received response from ${feed.url}:`, text.substring(0, 200) + '...');

            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'application/xml');

            // Check for parsing errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                throw new Error(`XML parsing error: ${parseError.textContent}`);
            }

            // Parse and process feed items
            const items = this.parseFeedItems(doc, feed);
            console.log(`Parsed ${items.length} items from ${feed.url}`);

            await this.processFeedItems(feed.id, items);

            // Update feed status on success
            this.feeds.set(feed.id, {
                ...feed,
                lastFetchTime: Date.now(),
                errorCount: 0,
                status: 'active'
            });
        } catch (error) {
            console.error(`Error fetching feed ${feed.url}:`, error);

            // Handle fetch errors with retry logic
            feed.errorCount = (feed.errorCount || 0) + 1;
            feed.lastError = error.message;

            if (feed.errorCount >= MAX_RETRIES) {
                feed.status = 'error';
                pubsub.emit('feedError', {
                    feedId: feed.id,
                    error: `Failed to fetch feed after ${MAX_RETRIES} attempts: ${error.message}`
                });
            } else if (feed.retryCount < MAX_RETRIES) {
                feed.retryCount++;
                this.fetchQueue.push(feed);
            }

            this.feeds.set(feed.id, feed);
        }

        await this.saveFeeds();

        // Hide loading indicator if this was the last fetch
        if (this.activeFetches === 1 && this.fetchQueue.length === 0) {
            pubsub.emit('newFeedItems', { count: 0 });
        }
    }

    /**
     * Parses feed items from an XML document.
     * Supports both RSS and Atom feed formats.
     *
     * @private
     * @param {Document} doc - The parsed XML document
     * @param {Object} feed - The feed object being processed
     * @returns {Array<Object>} Array of parsed feed items
     */
    parseFeedItems(doc, feed) {
        const items = [];
        let entries;

        // Try RSS format first, then Atom
        entries = doc.querySelectorAll('item');
        if (entries.length === 0) {
            entries = doc.querySelectorAll('entry');
        }

        for (const entry of entries) {
            const item = {
                feedId: feed.id,
                title: this.getElementText(entry, 'title'),
                content: this.getElementText(entry, 'description') || this.getElementText(entry, 'content'),
                link: this.getElementText(entry, 'link'),
                author: this.getElementText(entry, 'author'),
                published: this.parseDate(entry),
                urlHash: '',
                isRead: false,
                images: []
            };

            // Generate unique hash for deduplication
            item.urlHash = createHash(item.link);

            // Extract and track images for potential future caching
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = item.content;
            const images = Array.from(tempDiv.querySelectorAll('img')).map(img => ({
                originalUrl: img.src,
                localPath: null,
                status: 'pending'
            }));
            item.images = images;

            items.push(item);
        }

        return items;
    }

    /**
     * Extracts text content from an XML element.
     *
     * @private
     * @param {Element} parent - The parent element to search in
     * @param {string} tagName - The tag name to find
     * @returns {string} The text content or empty string if not found
     */
    getElementText(parent, tagName) {
        const element = parent.querySelector(tagName);
        return element ? element.textContent.trim() : '';
    }

    /**
     * Parses publication date from feed item.
     * Handles multiple date formats from RSS and Atom feeds.
     *
     * @private
     * @param {Element} entry - The feed entry element
     * @returns {string} ISO date string
     */
    parseDate(entry) {
        const dateStr =
            this.getElementText(entry, 'pubDate') || // RSS
            this.getElementText(entry, 'published') || // Atom
            this.getElementText(entry, 'updated') || // Atom fallback
            new Date().toISOString(); // Default to now

        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }

    /**
     * Processes new feed items, handling deduplication and storage.
     *
     * @async
     * @private
     * @param {string} feedId - ID of the feed being processed
     * @param {Array<Object>} newItems - Array of new items to process
     */
    async processFeedItems(feedId, newItems) {
        // Get existing items and seen hashes
        const existingItems = await storage.get(`feed_items_${feedId}`) || [];
        const seenHashes = await storage.get(`seen_hashes_${feedId}`) || [];

        // Create a map of existing items by hash for efficient lookup
        const existingItemsByHash = new Map(
            existingItems.map(item => [item.urlHash, item])
        );

        // Process new items
        let hasNewItems = false;
        for (const newItem of newItems) {
            const existingItem = existingItemsByHash.get(newItem.urlHash);

            // Update if item is new or newer than existing
            if (!existingItem || new Date(newItem.published) > new Date(existingItem.published)) {
                existingItemsByHash.set(newItem.urlHash, newItem);
                if (!seenHashes.includes(newItem.urlHash)) {
                    hasNewItems = true;
                }
            }
        }

        // Sort items by date and keep only the most recent ones
        const allItems = Array.from(existingItemsByHash.values())
            .sort((a, b) => new Date(b.published) - new Date(a.published));
        const itemsToKeep = allItems.slice(0, ITEMS_PER_FEED);

        // Update storage
        const updatedHashes = itemsToKeep.map(item => item.urlHash);
        await Promise.all([
            storage.set(`feed_items_${feedId}`, itemsToKeep),
            storage.set(`seen_hashes_${feedId}`, updatedHashes)
        ]);

        // Notify if we have new items
        if (hasNewItems) {
            pubsub.emit('newFeedItems', {
                feedId,
                count: itemsToKeep.length
            });
        }

        // Reload items in the UI
        await this.loadInitialItems();
    }

    /**
     * Loads initial items for display in the UI.
     * Handles deduplication across feeds and sorts by date.
     *
     * @async
     */
    async loadInitialItems() {
        console.log('Loading initial items...');
        const allItems = [];
        const seenHashes = new Set();

        // Collect and deduplicate items from all feeds
        for (const [feedId] of this.feeds) {
            const items = await storage.get(`feed_items_${feedId}`) || [];
            for (const item of items) {
                if (!seenHashes.has(item.urlHash)) {
                    allItems.push(item);
                    seenHashes.add(item.urlHash);
                }
            }
        }

        // Sort by date
        this.loadedItems = allItems.sort((a, b) => new Date(b.published) - new Date(a.published));
        console.log(`Total items loaded: ${this.loadedItems.length}`);

        // Only try to display items if we're on a page that shows feeds
        const container = document.querySelector('.feed-items');
        if (container) {
            container.innerHTML = '';
            await this.displayItems(0, INITIAL_LOAD_AMOUNT);
        }
    }

    /**
     * Displays feed items in the DOM.
     * Handles pagination and prevents duplicate displays.
     *
     * @async
     * @param {number} start - Starting index to display from
     * @param {number} count - Number of items to display
     */
    async displayItems(start, count) {
        console.log(`Displaying items from ${start} to ${start + count}`);
        const container = document.querySelector('.feed-items');
        if (!container) {
            console.error('Feed items container not found');
            return;
        }

        const items = this.loadedItems.slice(start, Math.min(start + count, this.loadedItems.length));
        console.log(`Displaying ${items.length} items`);

        // Track existing items to prevent duplicates
        const existingHashes = new Set(
            Array.from(container.children)
                .map(el => el.id)
        );

        for (const item of items) {
            // Skip if already displayed
            if (existingHashes.has(item.urlHash)) {
                continue;
            }

            // Create and configure feed item element
            const feedElement = document.createElement('kupukupu-feed-item');
            feedElement.id = item.urlHash;
            feedElement.setAttribute('title', item.title);
            feedElement.setAttribute('content', item.content);
            feedElement.setAttribute('source', item.author);
            feedElement.setAttribute('published', item.published);
            feedElement.setAttribute('link', item.link);
            if (item.isRead) {
                feedElement.setAttribute('isread', 'true');
            }

            container.appendChild(feedElement);
        }

        this.currentIndex = start + items.length;
    }

    /**
     * Handles scroll events for infinite scrolling.
     * Loads more items when approaching the bottom of the page.
     *
     * @private
     */
    handleScroll() {
        const container = document.querySelector('.feed-items');
        if (!container) return;

        const lastItem = container.lastElementChild;
        if (!lastItem) return;

        const buffer = window.innerHeight * 2;
        const bottomOfLastItem = lastItem.getBoundingClientRect().bottom;
        const bottomOfWindow = window.innerHeight + window.scrollY;

        if (bottomOfLastItem - bottomOfWindow < buffer) {
            this.loadMoreItems();
        }
    }

    /**
     * Loads more items for infinite scroll.
     *
     * @async
     * @private
     */
    async loadMoreItems() {
        if (this.currentIndex >= this.loadedItems.length) return;
        await this.displayItems(this.currentIndex, PRELOAD_AMOUNT);
    }

    /**
     * Marks a feed item as read.
     * Updates both the UI and storage.
     *
     * @async
     * @param {string} itemId - The URL hash of the item to mark as read
     */
    async markItemAsRead(itemId) {
        for (const [feedId] of this.feeds) {
            const items = await storage.get(`feed_items_${feedId}`) || [];
            const itemIndex = items.findIndex(item => item.urlHash === itemId);

            if (itemIndex !== -1) {
                items[itemIndex].isRead = true;
                await storage.set(`feed_items_${feedId}`, items);
                break;
            }
        }
    }
}

// Export singleton instance
export const feedManager = new FeedManager();