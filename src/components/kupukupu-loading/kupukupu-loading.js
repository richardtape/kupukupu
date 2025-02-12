import { storage } from '../../assets/js/storage.js';
import { pubsub } from '../../assets/js/pubsub.js';
import styles from './kupukupu-loading.css?inline';

/**
 * Loading Component
 *
 * Displays a loading spinner and message while content is being fetched.
 * Also shows a helpful message when no feeds are configured.
 */
class KupuKupuLoading extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._initialized = false;
        this._initializationPromise = null;
    }

    /**
     * Wait for the component to be ready
     */
    async ready() {
        if (!this._initialized && this._initializationPromise) {
            await this._initializationPromise;
        }
        return this._initialized;
    }

    async connectedCallback() {
        if (this._initialized) return;

        this._initializationPromise = this.initialize();
        await this._initializationPromise;
    }

    async initialize() {
        try {
            // Load and parse the HTML template
            const templateUrl = new URL('./kupukupu-loading.template.html', import.meta.url);
            console.log('Loading template from:', templateUrl.href);

            const templateResponse = await fetch(templateUrl);
            if (!templateResponse.ok) {
                throw new Error(`Failed to load template: ${templateResponse.status} ${templateResponse.statusText}`);
            }

            const templateText = await templateResponse.text();
            console.log('Template content:', templateText);

            const template = document.createElement('template');
            template.innerHTML = templateText;

            // Find our actual template element (ignoring Vite's injected content)
            const actualTemplate = template.content.querySelector('template');
            if (!actualTemplate) {
                throw new Error('Could not find template element in loaded content');
            }

            // Verify template content
            const templateContent = actualTemplate.content;
            console.log('Actual template content:', templateContent);

            if (!templateContent.querySelector('.loading') || !templateContent.querySelector('.no-feeds')) {
                throw new Error('Template is missing required elements');
            }

            // Create and apply the stylesheet
            const sheet = new CSSStyleSheet();
            await sheet.replaceSync(styles);
            this.shadowRoot.adoptedStyleSheets = [sheet];

            // Clone and attach the template content
            this.shadowRoot.appendChild(templateContent.cloneNode(true));

            // Cache element references
            this.loadingElement = this.shadowRoot.querySelector('.loading');
            this.noFeedsElement = this.shadowRoot.querySelector('.no-feeds');

            if (!this.loadingElement || !this.noFeedsElement) {
                console.error('Shadow root content:', this.shadowRoot.innerHTML);
                throw new Error('Required elements not found in shadow DOM after template attachment');
            }

            // Set up event listeners
            pubsub.on('newFeedItems', async () => {
                // Any newFeedItems event means the feed manager has finished its current operation
                // So we should check the current state
                const settings = await storage.get('settings') || {};
                const hasFeeds = Array.isArray(settings.rssFeeds) && settings.rssFeeds.length > 0;

                if (hasFeeds) {
                    // If we have feeds configured, hide everything as loading is complete
                    console.log('Feeds exist and loading complete, hiding all indicators');
                    this.hide();
                } else {
                    // No feeds configured, show the no-feeds message
                    console.log('No feeds configured, showing no-feeds message');
                    this.style.display = 'block';
                    this.loadingElement.classList.remove('is-active');
                    this.noFeedsElement.classList.add('is-active');
                }
            });
            pubsub.on('savedSettings', () => this.checkFeeds());

            // Show loading initially
            this.style.display = 'block';
            this.loadingElement.classList.add('is-active');
            this.noFeedsElement.classList.remove('is-active');

            this._initialized = true;
            await this.checkFeeds();
        } catch (error) {
            console.error('Failed to initialize loading component:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            this.shadowRoot.innerHTML = '<div>Loading...</div>';
            throw error;
        }
    }

    disconnectedCallback() {
        pubsub.off('newFeedItems', () => this.hide());
        pubsub.off('savedSettings', () => this.checkFeeds());
    }

    async checkFeeds() {
        await this.ready();
        console.log('Checking feeds...');

        const settings = await storage.get('settings') || {};
        console.log('Current settings:', settings);

        // Check if we have a valid rssFeeds array with items
        const hasFeeds = Array.isArray(settings.rssFeeds) && settings.rssFeeds.length > 0;
        console.log('Has feeds:', hasFeeds);

        if (!hasFeeds) {
            console.log('No feeds found, showing no-feeds message');
            // Hide loading spinner
            this.loadingElement.classList.remove('is-active');
            // Show no-feeds message
            this.style.display = 'block';
            this.noFeedsElement.classList.add('is-active');
        } else {
            console.log('Feeds found, showing loading');
            // Show loading until feeds are actually loaded
            this.style.display = 'block';
            this.loadingElement.classList.add('is-active');
            this.noFeedsElement.classList.remove('is-active');
        }
    }

    async show() {
        await this.ready();

        this.style.display = 'block';
        this.loadingElement.classList.add('is-active');
        this.noFeedsElement.classList.remove('is-active');
    }

    async hide() {
        await this.ready();

        this.style.display = 'none';
        this.loadingElement.classList.remove('is-active');
        this.noFeedsElement.classList.remove('is-active');
    }

    async showNoFeeds() {
        await this.ready();
        console.log('showNoFeeds - before changes:', {
            componentDisplay: this.style.display,
            loadingActive: this.loadingElement.classList.contains('is-active'),
            noFeedsActive: this.noFeedsElement.classList.contains('is-active')
        });

        // Make sure the component itself is visible
        this.style.display = 'block';
        this.loadingElement.classList.remove('is-active');
        this.noFeedsElement.classList.add('is-active');

        // Debug the computed styles
        const computedStyle = window.getComputedStyle(this.noFeedsElement);
        console.log('no-feeds element styles:', {
            display: computedStyle.display,
            classList: Array.from(this.noFeedsElement.classList),
            elementHtml: this.noFeedsElement.outerHTML
        });

        console.log('showNoFeeds - after changes:', {
            componentDisplay: this.style.display,
            loadingActive: this.loadingElement.classList.contains('is-active'),
            noFeedsActive: this.noFeedsElement.classList.contains('is-active')
        });
    }

    async hideNoFeeds() {
        await this.ready();

        this.noFeedsElement.classList.remove('is-active');
    }
}

customElements.define('kupukupu-loading', KupuKupuLoading);