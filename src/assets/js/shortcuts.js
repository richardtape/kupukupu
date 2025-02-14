import { isElectron } from '../../utils/index.js';
import { storage } from './storage.js';
import { pubsub } from './pubsub.js';
import { notify } from './notifications.js';

/**
 * A unified keyboard shortcuts interface for KupuKupu that works seamlessly across both Electron and browser environments.
 *
 * Features:
 * - Consistent API across browser and Electron environments
 * - Configurable shortcuts with storage persistence
 * - Cross-window shortcut synchronization in Electron
 * - Conflict prevention with browser/system shortcuts
 * - Accessibility support with ARIA attributes
 *
 * @example
 * // Import the shortcuts singleton
 * import { shortcuts } from './shortcuts.js';
 *
 * // Register a shortcut handler
 * shortcuts.register('navigateHome', () => {
 *     window.location.href = '/';
 * });
 */
class Shortcuts {
    constructor() {
        this.isElectron = isElectron();
        this.handlers = new Map();
        this.activeShortcuts = new Map();

        // Default shortcuts configuration
        this.defaults = {
            navigateHome: 'mod+h',
            navigateSettings: 'mod+,',
            toggleDrawer: 'mod+b',
            showHelp: 'mod+/',
            nextItem: 'mod+j',
            previousItem: 'mod+k',
            refreshFeeds: 'mod+r'
        };

        // Reserved shortcuts that can't be changed
        this.reserved = [
            'mod+w',  // Close window
            'mod+q',  // Quit
            'mod+r',  // Reload
            'mod+shift+r', // Hard reload
            'mod+shift+i', // Dev tools
            'f5',     // Reload
            'f11',    // Full screen
            'f12'     // Dev tools
        ];

        // Initialize
        this.init();
    }

    /**
     * Initialize the shortcuts system
     * @private
     */
    async init() {
        // Load saved shortcuts or use defaults
        const saved = await storage.get('shortcuts');
        if (saved) {
            // Merge saved shortcuts with defaults to ensure new shortcuts are included
            const merged = { ...this.defaults, ...saved };
            // Check if we added any new shortcuts
            if (Object.keys(merged).length !== Object.keys(saved).length) {
                // Save the merged shortcuts
                await storage.set('shortcuts', merged);
            }
            this.activeShortcuts = new Map(Object.entries(merged));
        } else {
            this.activeShortcuts = new Map(Object.entries(this.defaults));
        }

        // Set up event listeners
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // Listen for shortcut changes in other windows (Electron)
        if (this.isElectron) {
            pubsub.on('shortcutsChanged', ({ shortcuts }) => {
                this.activeShortcuts = new Map(Object.entries(shortcuts));
            });
        }
    }

    /**
     * Register a shortcut handler
     *
     * @param {string} action - The action identifier (e.g., 'navigateHome')
     * @param {Function} handler - The function to execute when the shortcut is triggered
     *
     * @example
     * shortcuts.register('navigateHome', () => {
     *     window.location.href = '/';
     * });
     */
    register(action, handler) {
        this.handlers.set(action, handler);
    }

    /**
     * Update a shortcut binding
     *
     * @param {string} action - The action to update
     * @param {string} shortcut - The new shortcut (e.g., 'mod+h')
     * @returns {Promise<boolean>} Success status
     *
     * @example
     * await shortcuts.update('navigateHome', 'mod+shift+h');
     */
    async update(action, shortcut) {
        // Validate the shortcut
        if (this.reserved.includes(shortcut)) {
            notify.error('This shortcut is reserved by the system');
            return false;
        }

        // Check for conflicts
        for (const [existingAction, existingShortcut] of this.activeShortcuts) {
            if (existingShortcut === shortcut && existingAction !== action) {
                notify.error('This shortcut is already in use');
                return false;
            }
        }

        // Update the shortcut
        this.activeShortcuts.set(action, shortcut);

        // Save to storage
        try {
            await storage.set('shortcuts', Object.fromEntries(this.activeShortcuts));

            // Notify other windows in Electron
            if (this.isElectron) {
                await pubsub.emit('shortcutsChanged', {
                    shortcuts: Object.fromEntries(this.activeShortcuts)
                });
            }

            notify.success('Shortcut updated successfully');
            return true;
        } catch (error) {
            notify.error('Failed to save shortcut');
            return false;
        }
    }

    /**
     * Reset all shortcuts to defaults
     * @returns {Promise<boolean>} Success status
     */
    async resetToDefaults() {
        try {
            this.activeShortcuts = new Map(Object.entries(this.defaults));
            await storage.set('shortcuts', this.defaults);

            if (this.isElectron) {
                await pubsub.emit('shortcutsChanged', { shortcuts: this.defaults });
            }

            notify.success('Shortcuts reset to defaults');
            return true;
        } catch (error) {
            notify.error('Failed to reset shortcuts');
            return false;
        }
    }

    /**
     * Get all registered shortcuts
     * @returns {Object} Map of action to shortcut
     */
    getAll() {
        return Object.fromEntries(this.activeShortcuts);
    }

    /**
     * Build a shortcut string from a keyboard event
     * @private
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {string} The shortcut string
     */
    buildShortcutString(event) {
        const parts = [];

        // Handle platform-specific modifier key
        if (this.isElectron && event.metaKey) {
            parts.push('mod');
        } else if (!this.isElectron && event.ctrlKey) {
            parts.push('mod');
        }

        if (event.shiftKey) parts.push('shift');
        if (event.altKey) parts.push('alt');

        // Handle special keys
        const key = event.key.toLowerCase();
        if (key === 'control' || key === 'shift' || key === 'alt' || key === 'meta') {
            // Don't add modifier keys by themselves
            return parts.join('+');
        }

        if (event.key.length === 1) {
            parts.push(event.key.toLowerCase());
        } else if (event.key === 'Slash') {
            parts.push('/');
        } else if (event.key === 'Period') {
            parts.push('.');
        } else if (event.key === 'Comma') {
            parts.push(',');
        } else if (event.key === 'Backslash') {
            parts.push('\\');
        } else if (event.key.startsWith('F')) {
            parts.push(event.key.toLowerCase());
        } else {
            parts.push(event.key.toLowerCase());
        }

        return parts.join('+');
    }

    /**
     * Handle keydown events
     * @private
     */
    handleKeydown(event) {
        // Only handle the platform-specific modifier
        if (this.isElectron && !event.metaKey) return;
        if (!this.isElectron && !event.ctrlKey) return;

        const shortcut = this.buildShortcutString(event);

        // Find and execute the matching handler
        for (const [action, registeredShortcut] of this.activeShortcuts) {
            if (registeredShortcut === shortcut) {
                const handler = this.handlers.get(action);
                if (handler) {
                    event.preventDefault();
                    handler();
                }
                break;
            }
        }
    }
}

// Export a singleton instance
export const shortcuts = new Shortcuts();