/**
 * KupuKupu Drawer Web Component
 *
 * A custom element that provides a sliding drawer component for the KupuKupu application.
 * This component is designed to work consistently across both web and electron environments.
 * It uses shadow DOM for style encapsulation and CSS custom properties for theming.
 *
 * Features:
 * - Sliding drawer with smooth animations
 * - Theme-aware styling using CSS custom properties
 * - Full accessibility support
 * - Focus management
 * - Click outside to close
 * - Reduced motion support
 * - Event system for state changes
 *
 * @module KupuKupuDrawer
 */

// Import styles as a module using Vite's inline loader
import styles from './kupukupu-drawer.css?inline';
import { pubsub } from '../../assets/js/pubsub.js';

/**
 * KupuKupuDrawer class
 * Implements a sliding drawer as a web component
 *
 * @class
 * @extends HTMLElement
 */
class KupuKupuDrawer extends HTMLElement {
    /**
     * Creates an instance of KupuKupuDrawer
     * Initializes the shadow DOM and state
     */
    constructor() {
        super();
        // Create shadow root in open mode to allow external access if needed
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
    }

    /**
     * Lifecycle callback when the element is added to the document
     * Loads the template and styles, then initializes the component
     *
     * @async
     * @returns {Promise<void>}
     */
    async connectedCallback() {
        // Load and parse the HTML template
        const templateResponse = await fetch(new URL('./kupukupu-drawer.template.html', import.meta.url));
        const templateText = await templateResponse.text();
        const template = document.createElement('template');
        template.innerHTML = templateText;

        // Create and apply the stylesheet to the shadow root
        const sheet = new CSSStyleSheet();
        await sheet.replaceSync(styles);
        this.shadowRoot.adoptedStyleSheets = [sheet];

        // Clone and attach the template content
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Initialize the drawer
        this.init();
    }

    /**
     * Initialize the drawer by setting up event listeners and initial ARIA states
     * @private
     */
    init() {
        // Set up DOM references
        this.drawer = this.shadowRoot.querySelector('.drawer');
        this.closeButton = this.shadowRoot.querySelector('.drawer-close');

        // Set initial accessibility attributes
        this.drawer.setAttribute('aria-hidden', 'true');
        this.drawer.setAttribute('aria-expanded', 'false');

        // Set up event listeners
        this.closeButton.addEventListener('click', () => this.close());
        document.addEventListener('click', this.handleClickOutside.bind(this));
        this.drawer.addEventListener('transitionend', this.handleTransitionEnd.bind(this));

        // Listen for open requests
        pubsub.on('openDrawer', () => this.open());
    }

    /**
     * Handles clicks outside the drawer to close it when open
     * @private
     * @param {MouseEvent} event - The click event
     */
    handleClickOutside(event) {
        const path = event.composedPath();
        if (this.isOpen &&
            !path.includes(this.drawer) &&
            !path.includes(document.getElementById('open-drawer'))) {
            this.close();
        }
    }

    /**
     * Handles the end of CSS transitions to emit appropriate events
     * @private
     * @param {TransitionEvent} event - The transition end event
     */
    handleTransitionEnd(event) {
        if (event.propertyName === 'transform') {
            pubsub.emit(this.isOpen ? 'drawerDidOpen' : 'drawerDidClose');
        }
    }

    /**
     * Opens the drawer and handles associated state changes
     * @public
     */
    open() {
        pubsub.emit('drawerWillOpen');
        this.isOpen = true;
        this.drawer.classList.add('open');
        document.querySelector('.main-content').classList.add('dimmed');
        this.drawer.setAttribute('aria-hidden', 'false');
        this.drawer.setAttribute('aria-expanded', 'true');
        this.closeButton.focus();
        pubsub.emit('drawerStateChange', { isOpen: true });
    }

    /**
     * Closes the drawer and handles associated state changes
     * @public
     */
    close() {
        pubsub.emit('drawerWillClose');
        this.isOpen = false;
        this.drawer.classList.remove('open');
        document.querySelector('.main-content').classList.remove('dimmed');
        this.drawer.setAttribute('aria-hidden', 'true');
        this.drawer.setAttribute('aria-expanded', 'false');
        document.getElementById('open-drawer').focus();
        pubsub.emit('drawerStateChange', { isOpen: false });
    }
}

// Register the custom element with the browser
customElements.define('kupukupu-drawer', KupuKupuDrawer);

export default KupuKupuDrawer;