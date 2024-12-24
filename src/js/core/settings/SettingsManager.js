/**
 * @file Core settings management functionality.
 * @module core/settings/SettingsManager
 */

import { isElectronEnvironment } from '../../utils/environment.js';
import BrowserStorageAdapter from '../storage/BrowserStorageAdapter.js';
import ElectronStorageAdapter from '../storage/ElectronStorageAdapter.js';

/**
 * @typedef {object} FeedEntry
 * @property {string} url - The URL of the RSS feed
 * @property {string} title - User-provided title for the feed
 * @property {string} id - Unique identifier for the feed
 * @property {Date} added - When the feed was added
 */

/**
 * Manages application settings and feed storage.
 */
class SettingsManager {
    /**
     * Creates a new SettingsManager instance.
     *
     * @example
     * const settings = new SettingsManager();
     * await settings.initialize();
     */
    constructor() {
        this.storage = isElectronEnvironment()
            ? new ElectronStorageAdapter()
            : new BrowserStorageAdapter();

        this.initialized = false;
    }

    /**
     * Initializes the settings manager and storage.
     *
     * @returns {Promise<void>}
     *
     * @example
     * const settings = new SettingsManager();
     * await settings.initialize();
     */
    async initialize() {
        if (this.initialized) return;

        try {
            await this.storage.initialize();
            this.initialized = true;
        } catch (error) {
            console.error('Storage initialization failed:', error);
            throw new Error('Failed to initialize storage: ' + error.message);
        }

        // Ensure we have a default theme set
        const currentTheme = await this.getTheme();
        if (!currentTheme) {
            await this.setTheme('fern');
        }
    }

    /**
     * Gets the current theme name.
     *
     * @returns {Promise<string>} The current theme name
     *
     * @example
     * const theme = await settings.getTheme();
     * console.log(`Current theme: ${theme}`);
     */
    async getTheme() {
        return this.storage.get('theme', 'settings');
    }

    /**
     * Sets the current theme.
     *
     * @param {string} themeName - Name of the theme to set
     * @returns {Promise<void>}
     * @throws {Error} If theme name is invalid
     *
     * @example
     * await settings.setTheme('dark');
     */
    async setTheme(themeName) {
        const validThemes = ['butterfly', 'fern', 'word'];
        if (!validThemes.includes(themeName)) {
            throw new Error(`Invalid theme: ${themeName}`);
        }
        await this.storage.set('theme', themeName, 'settings');
    }

    /**
     * Gets all saved feed entries.
     *
     * @returns {Promise<FeedEntry[]>} Array of feed entries
     *
     * @example
     * const feeds = await settings.getFeeds();
     * feeds.forEach(feed => console.log(feed.title));
     */
    async getFeeds() {
        const feeds = await this.storage.get('feeds', 'settings');
        return feeds || [];
    }

    /**
     * Adds a new feed entry.
     *
     * @param {string} url - The URL of the feed
     * @param {string} title - User-provided title
     * @returns {Promise<FeedEntry>} The newly added feed entry
     * @throws {Error} If URL or title is invalid
     *
     * @example
     * const newFeed = await settings.addFeed(
     *   'https://example.com/feed.xml',
     *   'Example Blog'
     * );
     */
    async addFeed(url, title) {
        if (!url || !title) {
            throw new Error('URL and title are required');
        }

        try {
            new URL(url);
        } catch {
            throw new Error('Invalid URL');
        }

        const feeds = await this.getFeeds();

        // Check for duplicate URLs
        if (feeds.some(feed => feed.url === url)) {
            throw new Error('Feed URL already exists');
        }

        const newFeed = {
            id: crypto.randomUUID(),
            url,
            title,
            added: new Date()
        };

        await this.storage.set('feeds', [...feeds, newFeed], 'settings');
        return newFeed;
    }

    /**
     * Removes a feed by its ID.
     *
     * @param {string} id - The ID of the feed to remove
     * @returns {Promise<void>}
     * @throws {Error} If feed is not found
     *
     * @example
     * await settings.removeFeed('123e4567-e89b-12d3-a456-426614174000');
     */
    async removeFeed(id) {
        const feeds = await this.getFeeds();
        const filteredFeeds = feeds.filter(feed => feed.id !== id);

        if (filteredFeeds.length === feeds.length) {
            throw new Error('Feed not found');
        }

        await this.storage.set('feeds', filteredFeeds, 'settings');
    }
}

export default SettingsManager;