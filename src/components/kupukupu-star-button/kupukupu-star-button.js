import { storage } from '../../assets/js/storage.js';
import { pubsub } from '../../assets/js/pubsub.js';
import templateUrl from './kupukupu-star-button.template.html?url';
import styles from './kupukupu-star-button.css?inline';

/**
 * KupukupuStarButton Web Component
 *
 * A custom element that provides starring functionality for feed items.
 *
 * Attributes:
 * - itemId: The ID of the feed item this button is associated with
 * - starred: Boolean attribute indicating if the item is currently starred
 *
 * Events Emitted:
 * - itemStarred: When an item is starred (with itemId)
 * - itemUnstarred: When an item is unstarred (with itemId)
 */
export class KupukupuStarButton extends HTMLElement {
    static get observedAttributes() {
        return ['itemId', 'starred'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.initialized = false;
    }

    /**
     * Lifecycle callback when the element is added to the document.
     */
    async connectedCallback() {
        try {
            await this.initializeTemplate();
            this.initialized = true;

            // Check if this item is starred
            await this.checkStarredStatus();

            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize star button:', error);
        }
    }

    /**
     * Initializes the component's template and styles.
     */
    async initializeTemplate() {
        try {
            // Add styles to shadow DOM
            const styleSheet = new CSSStyleSheet();
            await styleSheet.replace(styles);
            this.shadowRoot.adoptedStyleSheets = [styleSheet];

            const response = await fetch(templateUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const template = doc.querySelector('template');

            if (!template) {
                throw new Error('Template element not found in template file');
            }

            this.shadowRoot.appendChild(template.content.cloneNode(true));
            this.button = this.shadowRoot.querySelector('.star-button');
        } catch (error) {
            console.error('Failed to initialize template:', error);
            throw error;
        }
    }

    /**
     * Sets up event listeners for the star button.
     */
    setupEventListeners() {
        this.button.addEventListener('click', () => this.toggleStar());
    }

    /**
     * Triggers the star animation
     * @private
     */
    triggerAnimation() {
        this.button.classList.add('animating');
        setTimeout(() => {
            this.button.classList.remove('animating');
        }, 200); // Match the CSS transition duration
    }

    /**
     * Checks if the associated item is starred in storage.
     */
    async checkStarredStatus() {
        const itemId = this.getAttribute('itemId');
        if (!itemId) return;

        const permanentStorage = await storage.get('permanentStorage') || {};
        const starredItems = permanentStorage.starredItems || {};

        if (starredItems[itemId]) {
            this.setAttribute('starred', '');
        } else {
            this.removeAttribute('starred');
        }
    }

    /**
     * Toggles the starred state of the item.
     */
    async toggleStar() {
        const itemId = this.getAttribute('itemId');
        if (!itemId) return;

        // Trigger animation
        this.triggerAnimation();

        const permanentStorage = await storage.get('permanentStorage') || {};
        const starredItems = permanentStorage.starredItems || {};

        if (starredItems[itemId]) {
            // Unstar the item
            delete starredItems[itemId];
            this.removeAttribute('starred');
            await pubsub.emit('itemUnstarred', { itemId });
        } else {
            // Star the item
            const feedItem = document.querySelector(`kupukupu-feed-item[id="${itemId}"]`);
            if (!feedItem) return;

            starredItems[itemId] = {
                id: itemId,
                title: feedItem.getAttribute('title'),
                content: feedItem.getAttribute('content'),
                source: feedItem.getAttribute('source'),
                published: feedItem.getAttribute('published'),
                link: feedItem.getAttribute('link'),
                starredAt: new Date().toISOString()
            };

            this.setAttribute('starred', '');
            await pubsub.emit('itemStarred', { itemId });
        }

        // Update storage
        await storage.set('permanentStorage', {
            ...permanentStorage,
            starredItems
        });
    }

    /**
     * Updates the button's aria-label based on starred state.
     */
    updateAriaLabel() {
        const isStarred = this.hasAttribute('starred');
        this.button.setAttribute('aria-label', isStarred ? 'Unstar this item' : 'Star this item');
    }

    /**
     * Handles attribute changes.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'starred') {
            this.updateAriaLabel();
        }
    }
}

customElements.define('kupukupu-star-button', KupukupuStarButton);