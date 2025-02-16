/**
 * Navigation Utilities
 *
 * This module provides utility functions for navigation-related operations in KupuKupu.
 * These utilities help determine the current page context and validate navigation actions.
 *
 * @module navigation-utils
 */

/**
 * Checks if feed navigation should be enabled in the current context.
 * This function validates whether we're on a page with feed items and
 * ensures we're not focused on an input element.
 *
 * Used by:
 * - Feed navigation shortcuts (next/previous)
 * - Feed refresh shortcuts
 * - Any other feed-related keyboard operations
 *
 * @returns {boolean} True if feed navigation should be enabled
 * @example
 * if (shouldEnableFeedNavigation()) {
 *     // Perform feed navigation action
 * }
 */
export function shouldEnableFeedNavigation() {
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