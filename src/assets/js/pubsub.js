import mitt from 'mitt';
import { isElectron } from '../../utils/index.js';

/**
 * A unified pub/sub interface for KupuKupu that works seamlessly across both Electron and browser environments.
 *
 * Key Features:
 * - Consistent API across browser and Electron environments
 * - Automatic cross-window event propagation in Electron
 * - Deduplication of events in Electron to prevent double-handling
 * - Memory-efficient event tracking with automatic cleanup
 *
 * In the browser environment:
 * - Events are handled in-memory using mitt
 * - No cross-window communication (each window is isolated)
 *
 * In the Electron environment:
 * - Events are emitted locally first
 * - Then broadcast through IPC to all renderer windows
 * - Event IDs prevent double-handling when events return through IPC
 * - Events can be received by all open windows of the application
 *
 * @example
 * // Import the pubsub singleton
 * import { pubsub } from './pubsub.js';
 *
 * // Subscribe to events
 * pubsub.on('settingsChanged', (data) => {
 *     console.log('Settings changed:', data);
 * });
 *
 * // Publish events (async in Electron, sync in browser)
 * await pubsub.emit('settingsChanged', { theme: 'dark' });
 */
class PubSub {
    /**
     * Initializes the pub/sub interface and determines the runtime environment.
     * Sets up mitt as the event emitter and configures IPC listeners if in Electron.
     *
     * In Electron:
     * - Configures IPC event receiver for cross-window communication
     * - Sets up event ID tracking to prevent duplicate emissions
     */
    constructor() {
        this.isElectron = isElectron();
        this.emitter = mitt();
        this._lastEventId = 0;
        this._processedEvents = new Set();

        if (this.isElectron) {
            window.api.receive('events:receive', ({ eventName, data, sourceEventId }) => {
                if (!this._processedEvents.has(sourceEventId)) {
                    this._processedEvents.add(sourceEventId);
                    this.emitter.emit(eventName, data);
                }
            });
        }
    }

    /**
     * Subscribe to an event.
     *
     * The callback will be invoked whenever the event is emitted, whether from:
     * - The same window
     * - Another window (in Electron)
     * - The main process (in Electron)
     *
     * @param {string} event - The event name to subscribe to
     * @param {Function} callback - The callback function to execute when the event occurs
     *
     * @example
     * // Simple event handling
     * pubsub.on('themeChanged', (theme) => {
     *     document.body.className = theme;
     * });
     *
     * // Handle complex data
     * pubsub.on('settingsChanged', (settings) => {
     *     applySettings(settings);
     *     updateUI(settings);
     * });
     */
    on(event, callback) {
        this.emitter.on(event, callback);
    }

    /**
     * Unsubscribe from an event.
     *
     * Note: You must pass the same callback reference that was used to subscribe.
     *
     * @param {string} event - The event name to unsubscribe from
     * @param {Function} callback - The callback function to remove
     *
     * @example
     * const handler = (data) => console.log(data);
     *
     * // Subscribe
     * pubsub.on('notification', handler);
     *
     * // Later, unsubscribe
     * pubsub.off('notification', handler);
     */
    off(event, callback) {
        this.emitter.off(event, callback);
    }

    /**
     * Publish an event with optional data.
     *
     * In browser environment:
     * - Synchronously emits the event to local handlers
     *
     * In Electron environment:
     * 1. Emits locally first for immediate handling
     * 2. Broadcasts through IPC to all windows
     * 3. Uses event IDs to prevent duplicate handling
     *
     * @param {string} event - The event name to publish
     * @param {*} [data] - Optional data to pass with the event
     * @returns {Promise<void>} Resolves when the event has been emitted (and broadcast in Electron)
     *
     * @example
     * // Emit a simple event
     * await pubsub.emit('settingsSaved');
     *
     * // Emit an event with data
     * await pubsub.emit('themeChanged', {
     *     name: 'dark',
     *     accent: 'blue'
     * });
     */
    async emit(event, data) {
        const eventId = ++this._lastEventId;
        const eventPacket = { eventName: event, data, sourceEventId: eventId };

        if (this.isElectron) {
            this.emitter.emit(event, data);
            this._processedEvents.add(eventId);
            await window.api.events.emit(eventPacket);
        } else {
            this.emitter.emit(event, data);
        }

        // Clean up the event ID after a short delay
        setTimeout(() => {
            this._processedEvents.delete(eventId);
        }, 1000);
    }

    /**
     * Remove all event subscriptions.
     *
     * Use this method with caution as it will remove ALL event handlers.
     * Consider using `off()` for individual event unsubscription instead.
     *
     * @example
     * // Remove all subscriptions (e.g., when cleaning up)
     * pubsub.clear();
     */
    clear() {
        this.emitter.all.clear();
    }
}

// Export a singleton instance
export const pubsub = new PubSub();