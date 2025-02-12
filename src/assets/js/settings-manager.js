import { storage } from './storage.js';
import { pubsub } from './pubsub.js';
import { isElectron } from '../../utils/index.js';
import { getServerUrl } from '../../utils/config.js';

/**
 * Fetch a URL using the appropriate method for the environment
 */
async function fetchUrl(url) {
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/api/feed/validate?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to validate feed');
    }

    return data;
}

/**
 * Settings Manager
 *
 * Handles application-wide settings management including:
 * - Loading/saving settings
 * - Applying themes and visual modes
 * - Providing default settings
 * - Validating RSS feed URLs
 */
class SettingsManager {
    constructor() {
        this.defaults = {
            darkMode: true,
            theme: 'Fern',
            ollamaUrl: 'http://localhost:11434',
            rssFeeds: []
        };
    }

    /**
     * Load settings from storage
     * @returns {Promise<Object>} The settings object
     */
    async loadSettings() {
        try {
            return await storage.get('settings') || this.defaults;
        } catch (error) {
            console.log('Error loading settings:', error);
            return this.defaults;
        }
    }

    /**
     * Save settings to storage
     * @param {Object} settings - The settings to save
     * @returns {Promise<boolean>} Success status
     */
    async saveSettings(settings) {
        try {
            await storage.set('settings', settings);
            this.applyVisualSettings(settings.darkMode, settings.theme);
            return true;
        } catch (error) {
            console.log('Error saving settings:', error);
            return false;
        }
    }

    /**
     * Apply visual settings to the document
     * @param {boolean} isDark - Whether dark mode is enabled
     * @param {string} theme - The theme name to apply
     */
    applyVisualSettings(isDark, theme) {
        document.documentElement.setAttribute('data-mode', isDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme.toLowerCase());
    }

    /**
     * Initialize settings
     * @returns {Promise<Object>} The loaded settings
     */
    async initialize() {
        const settings = await this.loadSettings();
        this.applyVisualSettings(settings.darkMode, settings.theme);
        return settings;
    }

    /**
     * Validate a feed URL
     * @param {string} url - The URL to validate
     * @returns {Promise<Object>} Validation result with status and feed URL
     */
    async validateFeedUrl(url) {
        try {
            const result = await fetchUrl(url);
            return {
                isValid: result.isValid,
                feedUrl: result.feedUrl,
                error: result.error
            };
        } catch (error) {
            return {
                isValid: false,
                error: error.message
            };
        }
    }
}

// Export singleton instance
export const settingsManager = new SettingsManager();