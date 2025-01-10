import { isElectron } from '../../utils/index.js';

/**
 * A unified storage interface for KupuKupu that works seamlessly across both Electron and browser environments.
 * In the Electron environment, it uses electron-store via IPC calls for persistent storage.
 * In the browser environment, it falls back to localStorage with JSON serialization.
 *
 * All methods are asynchronous for consistency across environments, returning Promises.
 *
 * @example
 * // Import the storage singleton
 * import { storage } from './storage.js';
 *
 * // Basic usage
 * await storage.set('userPreferences', { theme: 'dark', fontSize: 14 });
 * const preferences = await storage.get('userPreferences');
 */
class Storage {
    /**
     * Initializes the storage interface and determines the runtime environment.
     * The environment detection is done by checking for the presence of the Electron API
     * which is exposed through the contextBridge.
     */
    constructor() {
        this.isElectron = isElectron();
    }

    /**
     * Retrieves a value from storage by its key.
     *
     * @param {string} key - The key to retrieve the value for
     * @returns {Promise<any>} A promise that resolves with the value, or null if not found
     *
     * @example
     * // Get a simple value
     * const username = await storage.get('username');
     *
     * // Get a complex object
     * const settings = await storage.get('appSettings');
     * if (settings) {
     *     console.log(settings.theme, settings.language);
     * }
     */
    async get(key) {
        if (this.isElectron) {
            return await window.api.store.get(key);
        }
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    }

    /**
     * Stores a value in storage with the specified key.
     *
     * @param {string} key - The key to store the value under
     * @param {any} value - The value to store. Must be JSON serializable in browser environment
     * @returns {Promise<void>} A promise that resolves when the value has been stored
     *
     * @example
     * // Store a simple value
     * await storage.set('lastLoginDate', new Date().toISOString());
     *
     * // Store a complex object
     * await storage.set('userPreferences', {
     *     theme: 'dark',
     *     notifications: true,
     *     shortcuts: {
     *         save: 'Ctrl+S',
     *         quit: 'Ctrl+Q'
     *     }
     * });
     */
    async set(key, value) {
        if (this.isElectron) {
            return await window.api.store.set(key, value);
        }
        localStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * Removes a value from storage by its key.
     *
     * @param {string} key - The key to remove from storage
     * @returns {Promise<void>} A promise that resolves when the value has been removed
     *
     * @example
     * // Remove a user's session
     * await storage.delete('sessionToken');
     */
    async delete(key) {
        if (this.isElectron) {
            return await window.api.store.delete(key);
        }
        localStorage.removeItem(key);
    }

    /**
     * Clears all values from storage.
     *
     * @returns {Promise<void>} A promise that resolves when all values have been cleared
     *
     * @example
     * // Clear all stored data (e.g., during logout)
     * await storage.clear();
     */
    async clear() {
        if (this.isElectron) {
            return await window.api.store.clear();
        }
        localStorage.clear();
    }

    /**
     * Checks if a key exists in storage.
     *
     * @param {string} key - The key to check for
     * @returns {Promise<boolean>} A promise that resolves with true if the key exists, false otherwise
     *
     * @example
     * // Check if user has completed onboarding
     * if (await storage.has('onboardingComplete')) {
     *     // Skip onboarding
     * } else {
     *     // Show onboarding
     * }
     */
    async has(key) {
        if (this.isElectron) {
            return await window.api.store.has(key);
        }
        return localStorage.getItem(key) !== null;
    }
}

// Export a singleton instance
export const storage = new Storage();