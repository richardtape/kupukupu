/**
 * Star Shortcuts Module
 *
 * This module handles registration of all star-related keyboard shortcuts in KupuKupu.
 * These shortcuts enable efficient starring and unstarring of feed items.
 *
 * Current shortcuts:
 * - mod+s: Toggle star state of active feed item
 *
 * Note: 'mod' key is Command (⌘) on macOS and Control on other platforms
 *
 * @module star-shortcuts
 */

import { shortcuts } from '../assets/js/shortcuts.js';
import { shouldEnableFeedNavigation } from '../utils/navigation.js';

/**
 * Registers all star-related keyboard shortcuts.
 * These shortcuts manage starring operations.
 *
 * Implementation details:
 * - Only enables shortcuts when appropriate (not in input fields)
 * - Only works when a feed item is active
 *
 * @example
 * // Register star shortcuts
 * registerStarShortcuts();
 */
export function registerStarShortcuts() {
    shortcuts.register('toggleStar', () => {
        if (!shouldEnableFeedNavigation()) return;

        const activeItem = document.querySelector('kupukupu-feed-item[active]');
        if (!activeItem) return;

        const starButton = activeItem.shadowRoot.querySelector('kupukupu-star-button');
        if (!starButton) return;

        starButton.toggleStar();
    });
}