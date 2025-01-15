/**
 * KupuKupu Navigation Web Component
 *
 * A custom element that provides the main navigation sidebar for the KupuKupu application.
 * This component is designed to work consistently across both web and electron environments.
 * It uses shadow DOM for style encapsulation and CSS custom properties for theming.
 *
 * Features:
 * - Responsive navigation sidebar
 * - Theme-aware styling using CSS custom properties
 * - Accessible keyboard navigation
 * - Automatic active state management
 * - Standard HTML navigation using anchor tags
 *
 * @module KupuKupuNavigation
 */

// Import styles as a module using Vite's inline loader
import styles from './kupukupu-navigation.css?inline';

/**
 * KupuKupuNavigation class
 * Implements the navigation sidebar as a web component
 *
 * @class
 * @extends HTMLElement
 */
class KupuKupuNavigation extends HTMLElement {
    /**
     * Creates an instance of KupuKupuNavigation
     * Initializes the shadow DOM for style encapsulation
     */
    constructor() {
        super();
        // Create shadow root in open mode to allow external access if needed
        this.attachShadow({ mode: 'open' });
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
        const templateResponse = await fetch(new URL('./kupukupu-navigation.template.html', import.meta.url));
        const templateText = await templateResponse.text();
        const template = document.createElement('template');
        template.innerHTML = templateText;

        // Create and apply the stylesheet to the shadow root
        const sheet = new CSSStyleSheet();
        await sheet.replaceSync(styles);
        this.shadowRoot.adoptedStyleSheets = [sheet];

        // Clone and attach the template content
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Initialize the active state based on the current URL
        this.setInitialActiveState();
    }

    /**
     * Sets the active state of navigation items based on the current URL
     * This ensures the correct navigation item is highlighted when the page loads
     *
     * @private
     */
    setInitialActiveState() {
        const currentPath = window.location.pathname;
        const links = this.shadowRoot.querySelectorAll('.nav-icon');

        // Compare each link's href with the current path
        links.forEach(link => {
            const href = link.getAttribute('href');
            // Extract just the filename from both the current path and href
            const currentFile = currentPath.split('/').pop() || 'index.html';
            const hrefFile = href.split('/').pop();
            // Compare the filenames
            link.classList.toggle('active', currentFile === hrefFile);
        });
    }
}

// Register the custom element with the browser
customElements.define('kupukupu-navigation', KupuKupuNavigation);

export default KupuKupuNavigation;