/**
 * Unread Manager Service
 *
 * Manages the unread state of feed items across the application.
 * Provides a centralized system for tracking and updating unread counts,
 * with optimized performance through caching and batch updates.
 *
 * Features:
 * - Efficient unread count tracking
 * - Count caching for performance
 * - Batch update support
 * - Event emission for count changes
 *
 * @module unread-manager
 */

import { pubsub } from './pubsub.js';
import { storage } from './storage.js';

class UnreadManager {
    constructor() {
        this.cache = {
            totalUnread: null,
            feedUnread: new Map()
        };
        this.initialized = false;
        this.batchUpdateTimeout = null;
    }

    /**
     * Initializes the unread manager.
     * Loads initial unread counts and sets up event listeners.
     *
     * @async
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) return;

        // Set up event listeners
        pubsub.on('feedItemRead', async ({ id }) => {
            await this.handleItemRead(id);
        });

        pubsub.on('newFeedItems', async ({ feedId }) => {
            await this.recalculateFeedUnread(feedId);
        });

        // Initial count calculation
        await this.recalculateAllUnread();

        this.initialized = true;
    }

    /**
     * Gets the total number of unread items across all feeds.
     * Uses cached value when available.
     *
     * @async
     * @returns {Promise<number>} The total number of unread items
     */
    async getTotalUnread() {
        if (this.cache.totalUnread !== null) {
            return this.cache.totalUnread;
        }

        await this.recalculateAllUnread();
        return this.cache.totalUnread;
    }

    /**
     * Gets the number of unread items for a specific feed.
     * Uses cached value when available.
     *
     * @async
     * @param {string} feedId - The ID of the feed
     * @returns {Promise<number>} The number of unread items in the feed
     */
    async getFeedUnread(feedId) {
        if (this.cache.feedUnread.has(feedId)) {
            return this.cache.feedUnread.get(feedId);
        }

        await this.recalculateFeedUnread(feedId);
        return this.cache.feedUnread.get(feedId) || 0;
    }

    /**
     * Handles when an item is marked as read.
     * Updates counts and emits events.
     *
     * @async
     * @private
     * @param {string} itemId - The ID of the item marked as read
     */
    async handleItemRead(itemId) {
        // Schedule a batch update
        if (this.batchUpdateTimeout) {
            clearTimeout(this.batchUpdateTimeout);
        }

        this.batchUpdateTimeout = setTimeout(async () => {
            await this.recalculateAllUnread();
        }, 100); // Debounce multiple rapid updates
    }

    /**
     * Recalculates unread counts for all feeds.
     * Updates cache and emits events.
     *
     * @async
     * @private
     */
    async recalculateAllUnread() {
        let total = 0;
        this.cache.feedUnread.clear();

        // Get all feed items from storage
        const feedKeys = await storage.get('feeds') || {};

        for (const feedId of Object.keys(feedKeys)) {
            const feedUnread = await this.recalculateFeedUnread(feedId);
            total += feedUnread;
        }

        const previousTotal = this.cache.totalUnread;
        this.cache.totalUnread = total;

        // Only emit if the count has changed
        if (previousTotal !== total) {
            pubsub.emit('unreadCountChanged', { total });
        }
    }

    /**
     * Recalculates unread count for a specific feed.
     * Updates cache and returns the new count.
     *
     * @async
     * @private
     * @param {string} feedId - The ID of the feed to recalculate
     * @returns {Promise<number>} The number of unread items in the feed
     */
    async recalculateFeedUnread(feedId) {
        const items = await storage.get(`feed_items_${feedId}`) || [];
        const unreadCount = items.filter(item => !item.isRead).length;

        this.cache.feedUnread.set(feedId, unreadCount);
        return unreadCount;
    }

    /**
     * Invalidates the cache, forcing a recalculation on next request.
     *
     * @async
     */
    async invalidateCache() {
        this.cache.totalUnread = null;
        this.cache.feedUnread.clear();
        await this.recalculateAllUnread();
    }
}

// Export singleton instance
export const unreadManager = new UnreadManager();