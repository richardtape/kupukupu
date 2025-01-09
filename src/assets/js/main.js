import { settingsManager } from './settings-manager.js';

/**
 * Initialize the application
 * This file is included on every page and handles core initialization
 */
async function initialize() {
    try {
        await settingsManager.initialize();
        console.log('Application initialized');
    } catch (error) {
        console.log('Error initializing application:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);