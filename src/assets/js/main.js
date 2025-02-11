import { settingsManager } from './settings-manager.js';
import './drawer-init.js';
import { shortcuts } from './shortcuts.js';
import { pubsub } from './pubsub.js';
import { isElectron } from '../../utils/index.js';
import { feedNavigation } from './feed-navigation.js';

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

/**
 * Initialize the application
 * This file is included on every page and handles core initialization
 */
async function initialize() {
    try {
        await settingsManager.initialize();
        console.log( 'in initialize' );
        // Only initialize feed navigation on pages with feed items
        if (document.querySelector('kupukupu-feed-item')) {
            await feedNavigation.initialize();

            console.log( 'in initialize, feedNavigation initialized' );

            // Register feed navigation shortcuts
            shortcuts.register('nextItem', () => {
                console.log('Next item shortcut triggered');
                if (shouldEnableFeedNavigation()) {
                    console.log('Navigation enabled, moving to next item');
                    feedNavigation.next();
                }
            }, { key: 'mod+j' });

            shortcuts.register('previousItem', () => {
                console.log('Previous item shortcut triggered');
                if (shouldEnableFeedNavigation()) {
                    console.log('Navigation enabled, moving to previous item');
                    feedNavigation.previous();
                }
            }, { key: 'mod+k' });
        }

        console.log('Application initialized');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);