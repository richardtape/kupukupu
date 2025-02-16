/**
 * Drawer Shortcuts Module
 *
 * This module handles registration of all drawer-related keyboard shortcuts in KupuKupu.
 * These shortcuts control the application's sliding drawer functionality, including
 * opening/closing the drawer and displaying help content.
 *
 * Current shortcuts:
 * - mod+b: Toggle drawer open/close
 * - mod+/: Show shortcuts help in drawer
 *
 * Note: 'mod' key is Command (⌘) on macOS and Control on other platforms
 *
 * @module drawer-shortcuts
 */

import { shortcuts } from '../assets/js/shortcuts.js';
import { pubsub } from '../assets/js/pubsub.js';

// Track drawer state
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
 * Registers all drawer-related keyboard shortcuts.
 * These shortcuts manage the drawer's visibility and content.
 *
 * Implementation details:
 * - Uses pubsub for drawer state management
 * - Maintains drawer open/closed state
 * - Tracks current drawer content
 * - Handles help content display
 *
 * @example
 * // Register drawer shortcuts
 * registerDrawerShortcuts();
 */
export function registerDrawerShortcuts() {
    // Toggle drawer visibility
    shortcuts.register('toggleDrawer', () => {
        if (isDrawerOpen) {
            pubsub.emit('closeDrawer');
        } else {
            pubsub.emit('openDrawer');
        }
    });

    // Show help in drawer
    shortcuts.register('showHelp', () => {
        if (isDrawerOpen && isShowingHelp) {
            pubsub.emit('closeDrawer');
        } else {
            pubsub.emit('openDrawer', { content: 'shortcuts-help' });
        }
    });
}