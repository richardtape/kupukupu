import { settingsManager } from './settings-manager.js';
import './drawer-init.js';
import { shortcuts } from './shortcuts.js';
import { pubsub } from './pubsub.js';
import { isElectron } from '../../utils/index.js';
import { feedNavigation } from './feed-navigation.js';
import { feedManager } from './feed-manager.js';
import { registerAllShortcuts } from '../../shortcuts/index.js';

let isDrawerOpen = false;
let isShowingHelp = false;

// Loading indicator singleton
let loadingIndicator;

// Listen for drawer state changes
pubsub.on('drawerStateChange', ({ isOpen }) => {
    isDrawerOpen = isOpen;
    if (!isOpen) {
        isShowingHelp = false;
    }
});

// Listen for drawer content changes
pubsub.on('drawerContentChanged', ({ content }) => {
    isShowingHelp = content === 'shortcuts-help';
});

/**
 * Initialize the loading indicator
 */
async function initializeLoadingIndicator() {
    if (!loadingIndicator) {
        loadingIndicator = document.querySelector('kupukupu-loading');
        // Wait for the component to be ready
        if (loadingIndicator) {
            await loadingIndicator.ready();
        }
    }
    return loadingIndicator;
}

/**
 * Show the loading indicator
 */
async function showLoading() {
    const indicator = await initializeLoadingIndicator();
    if (indicator) {
        await indicator.show();
    }
}

/**
 * Hide the loading indicator
 */
async function hideLoading() {
    const indicator = await initializeLoadingIndicator();
    if (indicator) {
        await indicator.hide();
    }
}

/**
 * Get the correct base path for navigation based on environment
 * @returns {string} The base path to use for navigation
 */
function getBasePath() {
    // In development web server, pages are served from /pages
    // In production electron app, pages are served from root
    return isElectron() ? '/' : '/pages/';
}

/**
 * Check if we're on a page where feed navigation should work
 * @returns {boolean} True if feed navigation should be enabled
 */
function shouldEnableFeedNavigation() {
    // Only enable on pages with feed items
    if (!document.querySelector('kupukupu-feed-item')) return false;

    // Don't enable when focus is in an input field
    const activeElement = document.activeElement;
    if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
    )) {
        return false;
    }

    return true;
}

/**
 * Initialize the application
 * This file is included on every page and handles core initialization
 */
async function initialize() {
    try {
        // Initialize settings first
        await settingsManager.initialize();

        // Register all keyboard shortcuts
        registerAllShortcuts();

        // Initialize feed manager (needed for all pages)
        await feedManager.initialize();

        // Only initialize feed-specific UI functionality on pages with feed items
        if (document.querySelector('.feed-items')) {
            // Initialize loading indicator first
            await initializeLoadingIndicator();

            // Show loading indicator
            await showLoading();

            // Initialize feed navigation
            await feedNavigation.initialize();

            // Hide loading indicator when feeds are loaded
            pubsub.on('newFeedItems', hideLoading);
        }

        console.log('Application initialized');
    } catch (error) {
        console.error('Error initializing application:', error);
        await hideLoading();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}