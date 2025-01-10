import { settingsManager } from './settings-manager.js';
import { pubsub } from './pubsub.js';
import '../../events/settings/index.js';

/**
 * Settings Page Handler
 *
 * Manages the settings page functionality including:
 * - Form initialization and event handling
 * - RSS feed management (add, delete, validation)
 * - Settings validation and persistence
 * - Real-time theme/mode application
 *
 * This class specifically handles the settings.html page interface,
 * while delegating the actual settings management to settingsManager.
 *
 * @example
 * // The page automatically initializes the handler
 * document.addEventListener('DOMContentLoaded', () => {
 *     new SettingsPage();
 * });
 */
class SettingsPage {
    /**
     * Creates a new SettingsPage instance and initializes the form
     */
    constructor() {
        // Form elements
        this.form = document.getElementById('settings-form');
        this.darkModeToggle = document.getElementById('darkMode');
        this.themeSelect = document.getElementById('theme');
        this.ollamaUrlInput = document.getElementById('ollamaUrl');
        this.rssFeedsContainer = document.getElementById('rss-feeds');
        this.addFeedButton = document.getElementById('add-feed');
        this.feedTemplate = document.getElementById('feed-template');

        this.initialize();
    }

    /**
     * Initializes the settings page by loading current settings,
     * populating the form, and setting up event listeners
     */
    async initialize() {
        // Load settings
        const settings = await settingsManager.initialize();

        // Apply settings to form
        this.darkModeToggle.checked = settings.darkMode;
        this.themeSelect.value = settings.theme;
        this.ollamaUrlInput.value = settings.ollamaUrl;

        // Load RSS feeds
        this.loadRssFeeds(settings.rssFeeds);

        // Set up event listeners
        this.setupEventListeners();

        // Add initial RSS feed if none exist
        if (this.rssFeedsContainer.children.length === 0) {
            this.addFeed();
        }
    }

    /**
     * Loads RSS feeds into the repeater interface
     * @param {Array<Object>} feeds - Array of feed objects with url and title
     */
    loadRssFeeds(feeds) {
        // Clear existing feeds
        this.rssFeedsContainer.innerHTML = '';

        // Add each feed
        feeds.forEach(feed => {
            const feedElement = this.createFeedElement(feed);
            this.rssFeedsContainer.appendChild(feedElement);
        });
    }

    /**
     * Creates a new RSS feed form element
     * @param {Object} feed - Feed object with optional url and title
     * @param {string} [feed.url=''] - The feed URL
     * @param {string} [feed.title=''] - The feed title
     * @returns {HTMLElement} The created feed element
     */
    createFeedElement(feed = { url: '', title: '' }) {
        const template = this.feedTemplate.content.cloneNode(true);
        const feedElement = template.querySelector('.repeater-item');

        // Set values if they exist
        feedElement.querySelector('.feed-url').value = feed.url;
        feedElement.querySelector('.feed-title').value = feed.title;

        // Add delete handler
        feedElement.querySelector('.delete-feed').addEventListener('click', () => {
            if (this.rssFeedsContainer.children.length > 1) {
                feedElement.remove();
            } else {
                console.log('Cannot delete the last feed item');
            }
        });

        return feedElement;
    }

    /**
     * Adds a new empty RSS feed form to the interface
     */
    addFeed() {
        const feedElement = this.createFeedElement();
        this.rssFeedsContainer.appendChild(feedElement);
    }

    /**
     * Collects all RSS feed data from the form
     * @returns {Array<Object>} Array of feed objects with url, title, and id
     */
    collectRssFeeds() {
        const feeds = [];
        this.rssFeedsContainer.querySelectorAll('.repeater-item').forEach((item, index) => {
            feeds.push({
                url: item.querySelector('.feed-url').value,
                title: item.querySelector('.feed-title').value,
                id: `feed-${index}`
            });
        });
        return feeds;
    }

    /**
     * Validates the Ollama URL
     * @returns {boolean} True if valid, false otherwise
     */
    validateOllamaUrl() {
        try {
            new URL(this.ollamaUrlInput.value);
            return true;
        } catch (error) {
            console.log('Invalid Ollama URL:', error);
            return false;
        }
    }

    /**
     * Validates all RSS feeds
     * @returns {boolean} True if all feeds are valid, false otherwise
     */
    validateRssFeeds() {
        const feeds = this.collectRssFeeds();
        for (const feed of feeds) {
            try {
                new URL(feed.url);
                if (!feed.title.trim()) {
                    console.log('RSS feed title cannot be empty');
                    return false;
                }
            } catch (error) {
                console.log('Invalid RSS feed URL:', error);
                return false;
            }
        }
        return true;
    }

    /**
     * Validates all settings in the form
     * @returns {boolean} True if all settings are valid, false otherwise
     */
    validateSettings() {
        return this.validateOllamaUrl() && this.validateRssFeeds();
    }

    /**
     * Sets up all event listeners for the settings form
     * - Dark mode toggle
     * - Theme selection
     * - Add feed button
     * - Form submission
     */
    setupEventListeners() {
        // Dark mode toggle
        this.darkModeToggle.addEventListener('change', (e) => {
            settingsManager.applyVisualSettings(e.target.checked, this.themeSelect.value);
        });

        // Theme selection
        this.themeSelect.addEventListener('change', (e) => {
            settingsManager.applyVisualSettings(this.darkModeToggle.checked, e.target.value);
        });

        // Add feed button
        this.addFeedButton.addEventListener('click', () => {
            this.addFeed();
        });

        // Form submission
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const settings = {
                darkMode: this.darkModeToggle.checked,
                theme: this.themeSelect.value,
                ollamaUrl: this.ollamaUrlInput.value,
                rssFeeds: this.collectRssFeeds()
            };

            // Emit before save event
            await pubsub.emit('beforeSaveSettings', settings);

            if (!this.validateSettings()) {
                await pubsub.emit('invalidSettings', {
                    ollamaUrl: !this.validateOllamaUrl(),
                    rssFeeds: !this.validateRssFeeds()
                });
                return;
            }

            try {
                if (await settingsManager.saveSettings(settings)) {
                    await pubsub.emit('savedSettings', settings);
                }
            } catch (error) {
                await pubsub.emit('savedSettingsFailed', error);
            }
        });
    }
}

// Initialize settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsPage();
});