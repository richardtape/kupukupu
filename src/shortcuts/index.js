/**
 * KupuKupu Shortcuts System
 *
 * This module serves as the central registration point for all keyboard shortcuts in KupuKupu.
 * It coordinates the registration of shortcuts across different functional areas of the application,
 * ensuring consistent behavior and avoiding conflicts.
 *
 * The shortcuts are organized into logical groups:
 * - Navigation: Page navigation shortcuts (home, settings)
 * - Drawer: Drawer control shortcuts (open/close, help)
 * - Feeds: Feed manipulation shortcuts (refresh, next/previous item)
 *
 * @module shortcuts
 */

import { registerNavigationShortcuts } from './navigation.js';
import { registerDrawerShortcuts } from './drawer.js';
import { registerFeedShortcuts } from './feeds.js';
import { registerStarShortcuts } from './star.js';

/**
 * Registers all keyboard shortcuts for the application.
 * This function should be called during application initialization.
 * It ensures that all shortcuts are registered in a consistent order
 * and that any dependencies are properly handled.
 *
 * Note: This function is idempotent - calling it multiple times
 * will not result in duplicate shortcut registrations.
 *
 * @example
 * // In your application initialization:
 * import { registerAllShortcuts } from './shortcuts';
 *
 * // Register all shortcuts
 * registerAllShortcuts();
 */
export function registerAllShortcuts() {
    // Register shortcuts in order of priority/dependency
    registerNavigationShortcuts();
    registerDrawerShortcuts();
    registerFeedShortcuts();
    registerStarShortcuts();
}