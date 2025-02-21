import { pubsub } from '../../assets/js/pubsub.js';
import templateUrl from './kupukupu-feed-item.template.html?url';
import styles from './kupukupu-feed-item.css?inline';
import '../kupukupu-star-button/kupukupu-star-button.js';

const READ_DELAY = 500; // 0.5 seconds before marking as read

/**
 * KupukupuFeedItem Web Component
 *
 * A custom element that displays a feed item with title, content, source, and publication date.
 * Supports keyboard navigation, focus management, and read state tracking.
 *
 * Attributes:
 * - title: The title of the feed item
 * - content: The HTML content of the feed item
 * - source: The source/author of the feed item
 * - published: ISO date string of when the item was published
 * - link: URL to the original content
 * - active: Boolean attribute indicating if this item is currently selected
 * - isread: Boolean attribute indicating if the item has been read
 *
 * Events Emitted:
 * - feedItemSelected: When the item becomes active (with id)
 * - feedItemRead: After the item has been active for READ_DELAY ms (with id)
 *
 * Features:
 * - Smooth opacity transitions between active/inactive states
 * - Automatic scroll into view when activated
 * - Keyboard focus management
 * - Error state handling with visual feedback
 * - Shadow DOM encapsulation
 *
 * @example
 * <kupukupu-feed-item
 *     id="item-1"
 *     title="Article Title"
 *     content="<p>Article content...</p>"
 *     source="Blog Name"
 *     published="2024-03-21T12:00:00Z"
 *     link="https://example.com/article"
 *     active="true">
 * </kupukupu-feed-item>
 */
export class KupukupuFeedItem extends HTMLElement {
    static get observedAttributes() {
        return ['title', 'content', 'source', 'published', 'link', 'active', 'isread'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.readTimer = null;
        this.initialized = false;
        this.pendingAttributes = new Map();
    }

    /**
     * Lifecycle callback when the element is added to the document.
     * Initializes the template, applies styles, and sets up initial state.
     */
    async connectedCallback() {
        try {
            await this.initializeTemplate();
            this.initialized = true;

            // Apply any attributes that were set before initialization
            this.pendingAttributes.forEach((value, name) => {
                this.handleAttributeChange(name, null, value);
            });
            this.pendingAttributes.clear();

            // Set up star button
            this.setupStarButton();
        } catch (error) {
            console.error('Failed to initialize feed item:', error);
            this.shadowRoot.innerHTML = `
                <div class="feed-item feed-item--error">
                    <p>Failed to load feed item. Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    /**
     * Initializes the component's template and styles.
     * Fetches the template, applies styles to shadow DOM, and sets up DOM elements.
     * @private
     * @throws {Error} If template fetch fails or required elements are missing
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

            // Query elements after template is inserted
            this.article = this.shadowRoot.querySelector('.feed-item');
            this.titleLink = this.shadowRoot.querySelector('.feed-item__title a');
            this.source = this.shadowRoot.querySelector('.feed-item__source');
            this.time = this.shadowRoot.querySelector('.feed-item__time');
            this.content = this.shadowRoot.querySelector('.feed-item__content');

            if (!this.article || !this.titleLink || !this.source || !this.time || !this.content) {
                throw new Error('Required elements not found in template');
            }

            this.setupEventListeners();
            this.updateContent();
        } catch (error) {
            console.error('Failed to initialize template:', error);
            throw error;
        }
    }

    /**
     * Lifecycle callback when the element is removed from the document.
     * Cleans up any timers to prevent memory leaks.
     */
    disconnectedCallback() {
        clearTimeout(this.readTimer);
    }

    /**
     * Lifecycle callback when attributes change.
     * Handles attribute changes before and after initialization.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (!this.initialized) {
            this.pendingAttributes.set(name, newValue);
            return;
        }

        this.handleAttributeChange(name, oldValue, newValue);
    }

    /**
     * Handles changes to component attributes.
     * Special handling for the 'active' attribute to manage focus and visual state.
     * @private
     */
    handleAttributeChange(name, oldValue, newValue) {
        console.log('handleAttributeChange', { id: this.id, name, oldValue, newValue });
        if (name === 'active') {
            const isActive = newValue !== null;
            if (isActive) {
                this.setAttribute('active', 'true');
                this.article.setAttribute('tabindex', '0');
                this.article.focus();
                this.shadowRoot.host.classList.add('active');
            } else {
                this.removeAttribute('active');
                this.article.setAttribute('tabindex', '-1');
                this.shadowRoot.host.classList.remove('active');
            }
            this.handleActiveState(isActive);
            return;
        }

        if (name === 'isread') {
            console.log('isread attribute changed', { id: this.id, name, oldValue, newValue });
            const isRead = newValue !== null;
            if (isRead) {
                this.article.classList.add('feed-item--read');
                this.shadowRoot.host.classList.add('feed-item--read');
            } else {
                this.article.classList.remove('feed-item--read');
                this.shadowRoot.host.classList.remove('feed-item--read');
            }
            return;
        }

        this.updateContent();
    }

    /**
     * Updates the component's content based on its attributes.
     * @private
     */
    updateContent() {
        if (!this.initialized) return;

        const title = this.getAttribute('title');
        const content = this.getAttribute('content');
        const source = this.getAttribute('source');
        const published = this.getAttribute('published');
        const link = this.getAttribute('link');

        if (this.titleLink) {
            this.titleLink.textContent = title;
            this.titleLink.href = link;
        }

        if (this.source) {
            this.source.textContent = source;
        }

        if (this.time) {
            const date = new Date(published);
            this.time.textContent = date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            this.time.setAttribute('datetime', published);
        }

        if (this.content) {
            this.content.innerHTML = content;
        }
    }

    /**
     * Sets up event listeners for the component.
     * Handles click events and prevents activation when clicking links.
     * @private
     */
    setupEventListeners() {
        this.article.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            this.setAttribute('active', 'true');
            pubsub.emit('feedItemSelected', { id: this.id });
        });
    }

    /**
     * Handles the active state of the feed item.
     * Manages read timer and scrolling behavior.
     * @private
     * @param {boolean} isActive - Whether the item is becoming active
     */
    handleActiveState(isActive) {
        if (!this.initialized || !this.article) return;

        if (isActive) {
            clearTimeout(this.readTimer);
            this.readTimer = setTimeout(() => {
                console.log('feedItemRead being emitted', { id: this.id });
                this.setAttribute('isread', 'true');
                pubsub.emit('feedItemRead', { id: this.id });
            }, READ_DELAY);

            this.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            clearTimeout(this.readTimer);
        }
    }

    /**
     * Sets up the star button with the item's ID and event listeners.
     */
    setupStarButton() {
        const starButton = this.shadowRoot.querySelector('kupukupu-star-button');
        if (!starButton) return;

        starButton.setAttribute('itemId', this.id);

        // Listen for star events
        pubsub.on('itemStarred', ({ itemId }) => {
            if (itemId === this.id) {
                this.setAttribute('starred', '');
            }
        });

        pubsub.on('itemUnstarred', ({ itemId }) => {
            if (itemId === this.id) {
                this.removeAttribute('starred');
            }
        });
    }
}

customElements.define('kupukupu-feed-item', KupukupuFeedItem);