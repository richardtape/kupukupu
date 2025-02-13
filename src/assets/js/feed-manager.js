import { storage } from './storage.js';
import { pubsub } from './pubsub.js';
import { settingsManager } from './settings-manager.js';
import { createHash } from '../../utils/hash.js';
import { shortcuts } from './shortcuts.js';
import { isElectron } from '../../utils/index.js';
import { getServerUrl } from '../../utils/config.js';

const FETCH_CONCURRENCY = 10;
const DEFAULT_FETCH_INTERVAL = 60 * 60 * 1000; // 60 minutes
const MAX_RETRIES = 3;
const ITEMS_PER_FEED = 10;
const PRELOAD_THRESHOLD = 5;
const PRELOAD_AMOUNT = 10;
const INITIAL_LOAD_AMOUNT = 20;
const HISTORY_RETENTION_DAYS = 365; // 1 year

/**
 * Fetch a URL using the appropriate method for the environment
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
 * Escape XML special characters
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
 * Manages RSS/Atom feed fetching, processing, and storage
 */
export class FeedManager {
    constructor() {
        this.feeds = new Map();
        this.fetchQueue = [];
        this.activeFetches = 0;
        this.initialized = false;
        this.loadedItems = [];
        this.currentIndex = 0;
    }

    /**
     * Initialize the feed manager
     */
    async initialize() {
        if (this.initialized) return;

        try {
            console.log('Initializing feed manager...');

            // Load feeds from storage
            const settings = await settingsManager.loadSettings();
            console.log('Loaded settings:', settings);

            if (!settings.rssFeeds || settings.rssFeeds.length === 0) {
                console.log('No RSS feeds configured');
                pubsub.emit('newFeedItems', { count: 0 }); // Hide loading indicator
                return;
            }

            // Convert feeds array to Map
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

            // Register refresh shortcut
            this.registerShortcuts();

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
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for settings changes
        pubsub.on('savedSettings', async (settings) => {
            await this.updateFeeds(settings.rssFeeds);
        });

        // Listen for feed item read events
        pubsub.on('feedItemRead', async ({ id }) => {
            await this.markItemAsRead(id);
        });

        // Listen for scroll events to handle infinite scroll
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', this.handleScroll.bind(this));
        }
    }

    /**
     * Register keyboard shortcuts
     */
    registerShortcuts() {
        // Register refresh shortcut (r)
        shortcuts.register('refreshFeeds', async () => {
            await this.fetchAllFeeds();
        }, { key: 'r' });
    }

    /**
     * Update feeds from settings
     */
    async updateFeeds(newFeeds) {
        const feedsMap = new Map();

        for (const feed of newFeeds) {
            const existingFeed = this.feeds.get(feed.id);
            feedsMap.set(feed.id, {
                ...feed,
                lastFetchTime: existingFeed?.lastFetchTime || 0,
                errorCount: existingFeed?.errorCount || 0,
                status: existingFeed?.status || 'active'
            });
        }

        this.feeds = feedsMap;
        await this.saveFeeds();
        await this.fetchAllFeeds();
    }

    /**
     * Save feeds to storage
     */
    async saveFeeds() {
        await storage.set('feeds', Object.fromEntries(this.feeds));
    }

    /**
     * Start background fetching
     */
    startBackgroundFetching() {
        setInterval(() => {
            this.fetchAllFeeds();
        }, DEFAULT_FETCH_INTERVAL);
    }

    /**
     * Fetch all feeds
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
     * Process the fetch queue with concurrency limit
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
     * Fetch a single feed
     */
    async fetchFeed(feed) {
        console.log(`Fetching feed: ${feed.url}`);
        try {
            const text = await fetchUrl(feed.url);
            console.log(`Received response from ${feed.url}:`, text.substring(0, 200) + '...');

            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'application/xml');

            // Check for parsing errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                throw new Error(`XML parsing error: ${parseError.textContent}`);
            }

            const items = this.parseFeedItems(doc, feed);
            console.log(`Parsed ${items.length} items from ${feed.url}`);

            await this.processFeedItems(feed.id, items);

            // Update feed status
            this.feeds.set(feed.id, {
                ...feed,
                lastFetchTime: Date.now(),
                errorCount: 0,
                status: 'active'
            });
        } catch (error) {
            console.error(`Error fetching feed ${feed.url}:`, error);

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

        // If this was the last active fetch and queue is empty, hide loading
        if (this.activeFetches === 1 && this.fetchQueue.length === 0) {
            pubsub.emit('newFeedItems', { count: 0 });
        }
    }

    /**
     * Parse feed items from XML document
     */
    parseFeedItems(doc, feed) {
        const items = [];
        let entries;

        // Try RSS
        entries = doc.querySelectorAll('item');
        if (entries.length === 0) {
            // Try Atom
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

            // Generate URL hash
            item.urlHash = createHash(item.link);

            // Extract images
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
     * Get text content from XML element
     */
    getElementText(parent, tagName) {
        const element = parent.querySelector(tagName);
        return element ? element.textContent.trim() : '';
    }

    /**
     * Parse publication date from feed item
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
     * Process new feed items
     */
    async processFeedItems(feedId, newItems) {
        // Get existing items and seen hashes
        const existingItems = await storage.get(`feed_items_${feedId}`) || [];
        const seenHashes = await storage.get(`seen_hashes_${feedId}`) || [];

        // Create a map of existing items by hash for easy lookup
        const existingItemsByHash = new Map(
            existingItems.map(item => [item.urlHash, item])
        );

        // Process new items
        let hasNewItems = false;
        for (const newItem of newItems) {
            const existingItem = existingItemsByHash.get(newItem.urlHash);

            // If we haven't seen this item before, or if it's newer than what we have
            if (!existingItem || new Date(newItem.published) > new Date(existingItem.published)) {
                existingItemsByHash.set(newItem.urlHash, newItem);
                if (!seenHashes.includes(newItem.urlHash)) {
                    hasNewItems = true;
                }
            }
        }

        // Convert map back to array and sort by date
        const allItems = Array.from(existingItemsByHash.values())
            .sort((a, b) => new Date(b.published) - new Date(a.published));

        // Keep only the most recent ITEMS_PER_FEED items
        const itemsToKeep = allItems.slice(0, ITEMS_PER_FEED);

        // Update seen hashes to include all items we're keeping
        const updatedHashes = itemsToKeep.map(item => item.urlHash);

        // Save to storage
        await Promise.all([
            storage.set(`feed_items_${feedId}`, itemsToKeep),
            storage.set(`seen_hashes_${feedId}`, updatedHashes)
        ]);

        // Only emit event if we actually have new items
        if (hasNewItems) {
            pubsub.emit('newFeedItems', {
                feedId,
                count: itemsToKeep.length
            });
        }

        // Reload items if we're displaying feeds
        await this.loadInitialItems();
    }

    /**
     * Load initial items for display
     */
    async loadInitialItems() {
        console.log('Loading initial items...');
        const allItems = [];
        const seenHashes = new Set();

        // Collect items from all feeds
        for (const [feedId] of this.feeds) {
            const items = await storage.get(`feed_items_${feedId}`) || [];
            // Only add items we haven't seen before
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

        // Clear existing items from the DOM
        const container = document.querySelector('.feed-items');
        if (container) {
            container.innerHTML = '';
        }

        // Load initial batch
        await this.displayItems(0, INITIAL_LOAD_AMOUNT);
    }

    /**
     * Display feed items in the DOM
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

        const existingHashes = new Set(
            Array.from(container.children)
                .map(el => el.id)
        );

        for (const item of items) {
            // Skip if this item is already displayed
            if (existingHashes.has(item.urlHash)) {
                continue;
            }

            const feedElement = document.createElement('kupukupu-feed-item');
            feedElement.id = item.urlHash;
            feedElement.setAttribute('title', item.title);
            feedElement.setAttribute('content', item.content);
            feedElement.setAttribute('source', item.author);
            feedElement.setAttribute('published', item.published);
            feedElement.setAttribute('link', item.link);

            container.appendChild(feedElement);
        }

        this.currentIndex = start + items.length;
    }

    /**
     * Handle infinite scroll
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
     * Load more items for infinite scroll
     */
    async loadMoreItems() {
        if (this.currentIndex >= this.loadedItems.length) return;
        await this.displayItems(this.currentIndex, PRELOAD_AMOUNT);
    }

    /**
     * Mark an item as read
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