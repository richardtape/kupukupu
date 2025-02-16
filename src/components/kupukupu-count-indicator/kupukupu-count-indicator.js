/**
 * Count Indicator Web Component
 *
 * A custom element that displays a count indicator bubble.
 * Used to show unread counts or other numerical indicators.
 * Supports automatic scaling based on digit count and smooth animations.
 *
 * @module kupukupu-count-indicator
 */

import { pubsub } from '../../assets/js/pubsub.js';
import { unreadManager } from '../../assets/js/unread-manager.js';
import templateUrl from './kupukupu-count-indicator.template.html?url';
import styles from './kupukupu-count-indicator.css?inline';

export class KupukupuCountIndicator extends HTMLElement {
    static get observedAttributes() {
        return ['count'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.count = 0;
    }

    /**
     * Lifecycle callback when the element is added to the document.
     * Sets up the component and initializes event listeners.
     */
    async connectedCallback() {
        await this.initializeTemplate();
        this.setupEventListeners();
        await this.updateCount();
    }

    /**
     * Initializes the component's template and styles.
     * @private
     */
    async initializeTemplate() {
        // Add styles to shadow DOM
        const styleSheet = new CSSStyleSheet();
        await styleSheet.replace(styles);
        this.shadowRoot.adoptedStyleSheets = [styleSheet];

        // Load and parse template
        const response = await fetch(templateUrl);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const template = doc.querySelector('template');

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Get references to elements
        this.indicator = this.shadowRoot.querySelector('.count-indicator');
        this.value = this.shadowRoot.querySelector('.count-indicator__value');
    }

    /**
     * Sets up event listeners for count changes.
     * @private
     */
    setupEventListeners() {
        pubsub.on('unreadCountChanged', async ({ total }) => {
            await this.setCount(total);
        });
    }

    /**
     * Updates the displayed count.
     * @private
     */
    async updateCount() {
        const total = await unreadManager.getTotalUnread();
        await this.setCount(total);
    }

    /**
     * Sets the count value and updates the display.
     * @param {number} count - The new count value
     */
    async setCount(count) {
        this.count = count;

        if (count > 0) {
            let displayCount = count;
            let digitClass = '1';

            if (count > 999) {
                displayCount = '999+';
                digitClass = '3+';
            } else if (count > 99) {
                digitClass = '3';
            } else if (count > 9) {
                digitClass = '2';
            }

            this.value.textContent = displayCount;
            this.indicator.dataset.digits = digitClass;
            this.indicator.classList.add('is-visible');
            this.indicator.setAttribute('aria-label', `${count} unread items`);
        } else {
            this.indicator.classList.remove('is-visible');
            this.value.textContent = '';
            this.indicator.removeAttribute('aria-label');
        }
    }

    /**
     * Handles attribute changes.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'count' && oldValue !== newValue) {
            this.setCount(parseInt(newValue, 10) || 0);
        }
    }
}

// Register the custom element
customElements.define('kupukupu-count-indicator', KupukupuCountIndicator);