import { Notyf } from 'notyf';
import { pubsub } from './pubsub.js';
import { isElectron } from '../../utils/index.js';
import 'notyf/notyf.min.css';

/**
 * A unified notifications interface for KupuKupu that works seamlessly across both Electron and browser environments.
 * Built on top of Notyf for efficient toast notifications.
 *
 * Features:
 * - Consistent API across browser and Electron environments
 * - Integration with PubSub system for cross-window notifications in Electron
 * - Support for success, error, and warning notifications
 * - Customizable duration and dismissible options
 * - Uses application theme colors
 *
 * @example
 * // Import the notifications singleton
 * import { notify } from './notifications.js';
 *
 * // Simple usage
 * notify.success('Settings saved successfully');
 * notify.error('Failed to save settings');
 * notify.warning('You have unsaved changes');
 *
 * // Advanced usage with options
 * notify.show({
 *     message: 'Are you sure?',
 *     type: 'warning',
 *     duration: 0, // Won't auto-dismiss
 *     dismissible: true
 * });
 */
class Notifications {
    /**
     * Initializes the notifications interface.
     * Sets up Notyf with custom types and theme colors.
     */
    constructor() {
        this.isElectron = isElectron();
        this.windowId = Math.random().toString(36).slice(2);

        // Initialize Notyf with our configuration
        this.notyf = new Notyf({
            duration: 2000,
            dismissible: true,
            position: { x: 'right', y: 'top' },
            types: [
                {
                    type: 'warning',
                    background: 'var(--color-warning)',
                    icon: {
                        className: 'notyf__icon--warning',
                        tagName: 'i'
                    }
                },
                {
                    type: 'error',
                    background: 'var(--color-error)',
                    dismissible: true,
                    icon: {
                        className: 'notyf__icon--error',
                        tagName: 'i'
                    }
                },
                {
                    type: 'success',
                    background: 'var(--color-success)',
                    icon: {
                        className: 'notyf__icon--success',
                        tagName: 'i'
                    }
                }
            ]
        });

        // Listen for notification events from other windows in Electron
        if (this.isElectron) {
            pubsub.on('notification', ({ type, message, options, sourceWindowId }) => {
                // Only show notifications from other windows
                if (sourceWindowId !== this.windowId) {
                    this._showNotification(type, message, options);
                }
            });
        }
    }

    /**
     * Shows a success notification
     *
     * @param {string} message - The message to display
     * @param {Object} [options] - Additional options for the notification
     * @returns {Object} The notification instance
     *
     * @example
     * notify.success('Settings saved successfully');
     *
     * // With options
     * notify.success('Settings saved', { duration: 5000 });
     */
    success(message, options = {}) {
        return this.show({ type: 'success', message, ...options });
    }

    /**
     * Shows an error notification
     *
     * @param {string} message - The message to display
     * @param {Object} [options] - Additional options for the notification
     * @returns {Object} The notification instance
     *
     * @example
     * notify.error('Failed to save settings');
     *
     * // With options
     * notify.error('Failed to save', { dismissible: true });
     */
    error(message, options = {}) {
        return this.show({ type: 'error', message, ...options });
    }

    /**
     * Shows a warning notification
     *
     * @param {string} message - The message to display
     * @param {Object} [options] - Additional options for the notification
     * @returns {Object} The notification instance
     *
     * @example
     * notify.warning('You have unsaved changes');
     *
     * // With options
     * notify.warning('Unsaved changes', { duration: 0 });
     */
    warning(message, options = {}) {
        return this.show({ type: 'warning', message, ...options });
    }

    /**
     * Shows a notification with the specified options
     *
     * @param {Object} options - The notification options
     * @param {string} options.message - The message to display
     * @param {string} [options.type='success'] - The type of notification
     * @param {number} [options.duration] - Duration in ms (0 for no auto-dismiss)
     * @param {boolean} [options.dismissible] - Whether the notification can be dismissed
     * @returns {Object} The notification instance
     *
     * @example
     * notify.show({
     *     message: 'Custom notification',
     *     type: 'warning',
     *     duration: 0,
     *     dismissible: true
     * });
     */
    show(options) {
        const { type = 'success', message, ...rest } = options;

        // Show notification in current window
        const notification = this._showNotification(type, message, rest);

        // In Electron, emit the notification to other windows
        if (this.isElectron) {
            pubsub.emit('notification', {
                type,
                message,
                options: rest,
                sourceWindowId: this.windowId
            });
        }

        return notification;
    }

    /**
     * Internal method to show the notification
     *
     * @private
     */
    _showNotification(type, message, options) {
        return this.notyf.open({
            type,
            message,
            ...options
        });
    }

    /**
     * Dismisses all notifications
     *
     * @example
     * notify.dismissAll();
     */
    dismissAll() {
        this.notyf.dismissAll();
    }
}

// Export a singleton instance
export const notify = new Notifications();