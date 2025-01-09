import { storage } from './storage.js';

/**
 * Settings Manager
 *
 * Handles application-wide settings management including:
 * - Loading/saving settings
 * - Applying themes and visual modes
 * - Providing default settings
 */
class SettingsManager {
    constructor() {
        this.defaults = {
            darkMode: true,
            theme: 'Fern',
            ollamaUrl: 'http://localhost:11434',
            rssFeeds: [{
                url: 'https://kupukupu.cc/feed/',
                title: 'Kupukupu',
                id: 'default'
            }]
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
}

// Export a singleton instance
export const settingsManager = new SettingsManager();