import { settingsManager } from './settings-manager.js';
import { pubsub } from './pubsub.js';
import { shortcuts } from './shortcuts.js';
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

        // New shortcut elements
        this.resetShortcutsButton = document.getElementById('reset-shortcuts');
        this.shortcutInputs = document.querySelectorAll('.shortcut-input');

        this.initialize();
    }

    /**
     * Initializes the settings page by loading current settings,
     * populating the form, and setting up event listeners
     */
    async initialize() {
        // Load current settings
        const settings = await settingsManager.loadSettings();

        // Apply current settings to form
        this.darkModeToggle.checked = settings.darkMode;
        this.themeSelect.value = settings.theme;
        this.ollamaUrlInput.value = settings.ollamaUrl;

        // Initialize RSS feeds
        if (settings.rssFeeds && settings.rssFeeds.length > 0) {
            settings.rssFeeds.forEach(feed => this.addFeed(feed));
        } else {
            this.addFeed();
        }

        // Initialize shortcuts
        this.initializeShortcuts();

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Initialize shortcuts UI
     */
    async initializeShortcuts() {
        const currentShortcuts = shortcuts.getAll();

        this.shortcutInputs.forEach(input => {
            const action = input.dataset.action;
            input.value = this.formatShortcut(currentShortcuts[action]);

            // Handle click to record new shortcut
            input.addEventListener('click', () => this.startRecordingShortcut(input));
        });
    }

    /**
     * Format a shortcut string for display
     */
    formatShortcut(shortcut) {
        if (!shortcut) return '';
        return shortcut
            .replace('mod', shortcuts.isElectron ? '⌘' : 'Ctrl')
            .replace('shift', '⇧')
            .replace('alt', '⌥')
            .replace('+', ' + ')
            .toUpperCase();
    }

    /**
     * Start recording a new shortcut
     */
    startRecordingShortcut(input) {
        const action = input.dataset.action;
        const originalValue = input.value;
        let isRecording = true;

        input.value = `Press ${shortcuts.isElectron ? '⌘' : 'Ctrl'} + key...`;
        input.classList.add('recording');

        const handleKeyDown = (event) => {
            // Prevent default browser shortcuts
            event.preventDefault();
            event.stopPropagation();
        };

        const handleKeyUp = async (event) => {
            if (!isRecording) return;

            // Only stop recording if at least one modifier key was pressed
            if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                return;
            }

            isRecording = false;
            const shortcut = shortcuts.buildShortcutString(event);

            // Don't record if it's just a modifier key
            if (shortcut.split('+').length === 1) {
                input.value = originalValue;
                input.classList.remove('recording');
                cleanup();
                return;
            }

            // Update shortcut
            const success = await shortcuts.update(action, shortcut);

            // Update input
            input.value = success ? this.formatShortcut(shortcut) : originalValue;
            input.classList.remove('recording');

            cleanup();
        };

        const cleanup = () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            isRecording = false;
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Handle blur
        input.addEventListener('blur', () => {
            if (isRecording) {
                input.value = originalValue;
                input.classList.remove('recording');
                cleanup();
            }
        }, { once: true });
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
    addFeed(feed = { url: '', title: '' }) {
        const feedElement = this.createFeedElement(feed);
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

        // New shortcuts reset button listener
        this.resetShortcutsButton.addEventListener('click', async () => {
            await shortcuts.resetToDefaults();
            await this.initializeShortcuts();
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