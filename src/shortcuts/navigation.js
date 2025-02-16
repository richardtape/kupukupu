/**
 * Navigation Shortcuts Module
 *
 * This module handles registration of all navigation-related keyboard shortcuts in KupuKupu.
 * These shortcuts allow users to quickly navigate between different pages of the application.
 *
 * Current shortcuts:
 * - mod+h: Navigate to home page
 * - mod+,: Navigate to settings page
 *
 * Note: 'mod' key is Command (⌘) on macOS and Control on other platforms
 *
 * @module navigation-shortcuts
 */

import { shortcuts } from '../assets/js/shortcuts.js';

/**
 * Registers all navigation-related keyboard shortcuts.
 * These shortcuts enable quick navigation between different pages of the application.
 *
 * Implementation details:
 * - Uses window.location.href for navigation
 * - Maintains consistent navigation patterns across the application
 * - Follows platform conventions for modifier keys
 *
 * @example
 * // Register navigation shortcuts
 * registerNavigationShortcuts();
 */
export function registerNavigationShortcuts() {
    // Navigate to home page
    shortcuts.register('navigateHome', () => {
        window.location.href = './index.html';
    });

    // Navigate to settings page
    shortcuts.register('navigateSettings', () => {
        window.location.href = './settings.html';
    });
}