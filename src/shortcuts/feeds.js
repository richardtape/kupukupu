/**
 * Feed Shortcuts Module
 *
 * This module handles registration of all feed-related keyboard shortcuts in KupuKupu.
 * These shortcuts enable efficient feed navigation and management, including
 * refreshing feeds and navigating between feed items.
 *
 * Current shortcuts:
 * - mod+r: Refresh all feeds
 * - mod+j: Navigate to next feed item
 * - mod+k: Navigate to previous feed item
 *
 * Note: 'mod' key is Command (⌘) on macOS and Control on other platforms
 *
 * @module feed-shortcuts
 */

import { shortcuts } from '../assets/js/shortcuts.js';
import { pubsub } from '../assets/js/pubsub.js';
import { feedNavigation } from '../assets/js/feed-navigation.js';
import { shouldEnableFeedNavigation } from '../utils/navigation.js';

/**
 * Registers all feed-related keyboard shortcuts.
 * These shortcuts manage feed operations and navigation.
 *
 * Implementation details:
 * - Uses pubsub for feed operations
 * - Integrates with feed navigation system
 * - Validates current page context before executing
 * - Only enables shortcuts when appropriate (not in input fields)
 *
 * @example
 * // Register feed shortcuts
 * registerFeedShortcuts();
 */
export function registerFeedShortcuts() {
    // Refresh all feeds
    shortcuts.register('refreshFeeds', () => {
        if (shouldEnableFeedNavigation()) {
            pubsub.emit('refreshFeeds');
        }
    });

    // Navigate to next feed item
    shortcuts.register('nextItem', () => {
        if (shouldEnableFeedNavigation()) {
            feedNavigation.next();
        }
    });

    // Navigate to previous feed item
    shortcuts.register('previousItem', () => {
        if (shouldEnableFeedNavigation()) {
            feedNavigation.previous();
        }
    });
}