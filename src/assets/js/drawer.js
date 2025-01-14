/**
 * Drawer functionality with accessibility support.
 * Provides a sliding drawer component that can be opened from the right side of the screen.
 * Includes accessibility features such as:
 * - ARIA attributes for visibility state
 * - Focus management
 * - Click outside to close
 * - Reduced motion support (via CSS)
 *
 * Events emitted:
 * - drawerWillOpen: Emitted before the drawer starts opening
 * - drawerDidOpen: Emitted after the drawer has opened
 * - drawerWillClose: Emitted before the drawer starts closing
 * - drawerDidClose: Emitted after the drawer has closed
 * - drawerStateChange: Emitted when drawer state changes (with isOpen boolean)
 *
 * @module Drawer
 */

import { pubsub } from './pubsub.js';

/**
 * Manages the drawer component's functionality and state
 */
class Drawer {
    /**
     * Creates a new Drawer instance and initializes required elements and event listeners
     * @constructor
     * @throws {Error} Will fail silently if required DOM elements are not found
     */
    constructor() {
        // Initialize DOM elements
        this.drawer = document.querySelector('.drawer');
        this.mainContent = document.querySelector('.main-content');
        this.openButton = document.getElementById('open-drawer');
        this.closeButton = document.querySelector('.drawer-close');

        // Bind methods to maintain correct 'this' context
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleTransitionEnd = this.handleTransitionEnd.bind(this);

        // Initialize the drawer
        this.init();
    }

    /**
     * Initializes the drawer by setting up event listeners and initial ARIA states.
     * @private
     * @returns {void}
     */
    init() {
        if (!this.drawer || !this.openButton || !this.closeButton) return;

        // Set up event listeners
        this.openButton.addEventListener('click', this.open);
        this.closeButton.addEventListener('click', this.close);
        document.addEventListener('click', this.handleClickOutside);
        this.drawer.addEventListener('transitionend', this.handleTransitionEnd);

        // Set initial accessibility attributes
        this.drawer.setAttribute('aria-hidden', 'true');
        this.drawer.setAttribute('aria-expanded', 'false');
    }

    /**
     * Handles the end of CSS transitions to emit appropriate events
     * @private
     * @param {TransitionEvent} event - The transition end event
     * @returns {void}
     */
    handleTransitionEnd(event) {
        if (event.propertyName === 'transform') {
            const isOpen = this.drawer.classList.contains('open');
            pubsub.emit(isOpen ? 'drawerDidOpen' : 'drawerDidClose');
        }
    }

    /**
     * Handles clicks outside the drawer to close it when open.
     * Ignores clicks on the drawer itself and the open button.
     * @private
     * @param {MouseEvent} event - The click event
     * @returns {void}
     */
    handleClickOutside(event) {
        if (this.drawer.classList.contains('open') &&
            !this.drawer.contains(event.target) &&
            !this.openButton.contains(event.target)) {
            this.close();
        }
    }

    /**
     * Opens the drawer and handles associated state changes.
     * - Adds 'open' class to drawer
     * - Dims the main content
     * - Updates ARIA attributes
     * - Manages focus
     * - Emits relevant events
     * @public
     * @returns {void}
     */
    open() {
        pubsub.emit('drawerWillOpen');

        this.drawer.classList.add('open');
        this.mainContent.classList.add('dimmed');
        this.drawer.setAttribute('aria-hidden', 'false');
        this.drawer.setAttribute('aria-expanded', 'true');

        // Move focus to close button for accessibility
        this.closeButton.focus();

        // Emit state change event
        pubsub.emit('drawerStateChange', { isOpen: true });
    }

    /**
     * Closes the drawer and handles associated state changes.
     * - Removes 'open' class from drawer
     * - Removes dimming from main content
     * - Updates ARIA attributes
     * - Returns focus to open button
     * - Emits relevant events
     * @public
     * @returns {void}
     */
    close() {
        pubsub.emit('drawerWillClose');

        this.drawer.classList.remove('open');
        this.mainContent.classList.remove('dimmed');
        this.drawer.setAttribute('aria-hidden', 'true');
        this.drawer.setAttribute('aria-expanded', 'false');

        // Return focus to open button for accessibility
        this.openButton.focus();

        // Emit state change event
        pubsub.emit('drawerStateChange', { isOpen: false });
    }
}

// Initialize drawer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Drawer();
});