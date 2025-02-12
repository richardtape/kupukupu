import { shortcuts } from './shortcuts.js';
import { pubsub } from './pubsub.js';

export class FeedNavigation {
    constructor() {
        this.feedItems = [];
        this.currentIndex = -1;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        this.updateFeedItems();
        this.setupEventListeners();

        // Set initial active state
        if (this.feedItems.length > 0) {
            this.setActiveItem(0);
        }

        this.initialized = true;
    }

    setupEventListeners() {
        // Listen for feed item selection
        pubsub.on('feedItemSelected', ({ id }) => {
            const index = this.feedItems.findIndex(item => item.id === id);
            if (index !== -1) {
                this.setActiveItem(index);
            }
        });

        // Listen for new feed items
        pubsub.on('newFeedItems', () => {
            this.updateFeedItems();
        });

        // Watch for DOM changes in feed items container
        if (typeof window !== 'undefined') {
            const observer = new MutationObserver(() => {
                this.updateFeedItems();
            });

            const container = document.querySelector('.feed-items');
            if (container) {
                observer.observe(container, {
                    childList: true,
                    subtree: true
                });
            }
        }
    }

    updateFeedItems() {
        this.feedItems = Array.from(document.querySelectorAll('kupukupu-feed-item'));
    }

    setActiveItem(index) {
        // Remove active state from current item
        if (this.currentIndex !== -1 && this.feedItems[this.currentIndex]) {
            this.feedItems[this.currentIndex].removeAttribute('active');
        }

        // Set new active item
        this.currentIndex = index;
        if (this.feedItems[this.currentIndex]) {
            this.feedItems[this.currentIndex].setAttribute('active', 'true');
        }
    }

    next() {
        if (this.currentIndex < this.feedItems.length - 1) {
            this.setActiveItem(this.currentIndex + 1);
        }
    }

    previous() {
        if (this.currentIndex > 0) {
            this.setActiveItem(this.currentIndex - 1);
        }
    }
}

export const feedNavigation = new FeedNavigation();