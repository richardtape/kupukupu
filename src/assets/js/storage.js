import { isElectron } from '../../utils/index.js';

/**
 * A unified storage interface for KupuKupu that works seamlessly across both Electron and browser environments.
 * In the Electron environment, it uses electron-store via IPC calls for persistent storage.
 * In the browser environment, it uses IndexedDB for persistent storage.
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
     * For browser environments, initializes IndexedDB.
     */
    constructor() {
        this.isElectron = isElectron();
        this.dbName = 'kupukupu';
        this.storeName = 'keyValueStore';
        this.version = 1;
        this.db = null;

        if (!this.isElectron) {
            this.initDB();
        }
    }

    /**
     * Initializes the IndexedDB database.
     * @private
     */
    async initDB() {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create stores if they don't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    /**
     * Ensures the database is initialized before performing operations.
     * @private
     */
    async ensureDB() {
        if (!this.db) {
            await this.initDB();
        }
    }

    /**
     * Performs a transaction on the database.
     * @private
     */
    async dbOperation(storeName, mode, operation) {
        await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);

            const request = operation(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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

        try {
            return await this.dbOperation(this.storeName, 'readonly', store => store.get(key));
        } catch (error) {
            console.error('Error retrieving from IndexedDB:', error);
            return null;
        }
    }

    /**
     * Stores a value in storage with the specified key.
     *
     * @param {string} key - The key to store the value under
     * @param {any} value - The value to store
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

        try {
            await this.dbOperation(this.storeName, 'readwrite', store => store.put(value, key));
        } catch (error) {
            console.error('Error storing in IndexedDB:', error);
            throw error;
        }
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

        try {
            await this.dbOperation(this.storeName, 'readwrite', store => store.delete(key));
        } catch (error) {
            console.error('Error deleting from IndexedDB:', error);
            throw error;
        }
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

        try {
            await this.dbOperation(this.storeName, 'readwrite', store => store.clear());
        } catch (error) {
            console.error('Error clearing IndexedDB:', error);
            throw error;
        }
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

        try {
            const value = await this.get(key);
            return value !== undefined && value !== null;
        } catch (error) {
            console.error('Error checking key in IndexedDB:', error);
            return false;
        }
    }
}

// Export a singleton instance
export const storage = new Storage();