import { settingsManager } from './settings-manager.js';
import './drawer-init.js';
import { shortcuts } from './shortcuts.js';
import { pubsub } from './pubsub.js';
import { isElectron } from '../../utils/index.js';

let isDrawerOpen = false;
let isShowingHelp = false;

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
 * Get the correct base path for navigation based on environment
 * @returns {string} The base path to use for navigation
 */
function getBasePath() {
    // In development web server, pages are served from /pages
    // In production electron app, pages are served from root
    return isElectron() ? '/' : '/pages/';
}

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

// Register shortcut handlers
shortcuts.register('navigateHome', () => {
    window.location.href = './index.html';
});

shortcuts.register('navigateSettings', () => {
    window.location.href = './settings.html';
});

shortcuts.register('toggleDrawer', () => {
    if (isDrawerOpen) {
        pubsub.emit('closeDrawer');
    } else {
        pubsub.emit('openDrawer');
    }
});

shortcuts.register('showHelp', () => {
    if (isDrawerOpen && isShowingHelp) {
        pubsub.emit('closeDrawer');
    } else {
        pubsub.emit('openDrawer', { content: 'shortcuts-help' });
    }
});