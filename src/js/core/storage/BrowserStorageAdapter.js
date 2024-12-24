/**
 * @file Browser storage adapter implementation using IndexedDB.
 * This implementation handles all IndexedDB-specific operations while maintaining
 * the interface defined by StorageAdapter.
 *
 * @module core/storage/BrowserStorageAdapter
 */

import StorageAdapter from './StorageAdapter.js';

/* global indexedDB, navigator */

/** @typedef {import('./StorageAdapter.js').StorageMetadata} StorageMetadata */

// Browser built-in type definitions
/** @typedef {globalThis.Event} Event */
/** @typedef {globalThis.IDBDatabase} IDBDatabase */
/** @typedef {globalThis.IDBRequest} IDBRequest */
/** @typedef {globalThis.IDBObjectStore} IDBObjectStore */
/** @typedef {globalThis.IDBTransaction} IDBTransaction */

/**
 * @typedef {object} StorageRecord
 * @property {*} value - The stored value
 * @property {StorageMetadata} metadata - Metadata about the stored value
 */

/**
 * @typedef {object} IDBEventTarget
 * @property {*} result - The result of the request
 */

/**
 * @typedef {Event} IDBEvent
 * @property {IDBEventTarget} target - The target of the event
 */

/**
 * Browser-specific storage adapter implementation using IndexedDB.
 */
class BrowserStorageAdapter extends StorageAdapter {
    /**
     * Creates a new BrowserStorageAdapter instance.
     *
     * @example
     * const storage = new BrowserStorageAdapter();
     * await storage.initialize();
     */
    constructor() {
        super();
        this.DB_NAME = 'kupukupu-storage';
        this.DB_VERSION = 1;
        this.db = null;
        this.ready = false;
    }

    /**
     * Gets the current IndexedDB database version.
     *
     * @protected
     * @returns {Promise<number>} The current database version
     * @throws {Error} If unable to get database version
     *
     * @example
     * const version = await storage.getCurrentVersion();
     * console.log(`Current database version: ${version}`);
     */
    async getCurrentVersion() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME);

            /**
             * Handles errors during the database open request.
             *
             * @param {Event} event - The error event
             * @private
             */
            request.onerror = (event) => {
                reject(new Error('Failed to get database version: ' + event.target.error.message));
            };

            /**
             * Handles successful database open request.
             *
             * @param {Event} event - The success event
             * @private
             */
            request.onsuccess = (event) => {
                const version = event.target.result.version;
                event.target.result.close();
                resolve(version);
            };

            /**
             * Handles blocked database open request.
             *
             * @private
             */
            request.onblocked = () => {
                reject(new Error('Database blocked while getting version'));
            };
        });
    }

    /**
     * Initializes the IndexedDB database and creates required object stores.
     * Must be called before any other operations.
     *
     * @returns {Promise<void>}
     * @throws {Error} If database initialization fails
     *
     * @example
     * const storage = new BrowserStorageAdapter();
     * try {
     *   await storage.initialize();
     *   console.log('Storage initialized');
     * } catch (error) {
     *   console.error('Failed to initialize storage:', error);
     * }
     */
    async initialize() {
        if (this.ready) return;

        try {
            const currentVersion = await this.getCurrentVersion();

            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.DB_NAME, currentVersion);

                /**
                 * Handles errors during the database open request.
                 *
                 * @param {Event} event - The error event
                 * @private
                 */
                request.onerror = (event) => {
                    console.error('Database error:', event.target.error);
                    reject(new Error('Failed to open database: ' + event.target.error.message));
                };

                /**
                 * Handles blocked database open request.
                 *
                 * @private
                 */
                request.onblocked = () => {
                    console.warn('Database blocked, please close other tabs');
                    reject(new Error('Database blocked'));
                };

                /**
                 * Handles successful database open request.
                 * Checks if initial stores exist and if not, creates them.
                 *
                 * @param {Event} event - The success event
                 * @private
                 */
                request.onsuccess = (event) => {
                    this.db = event.target.result;

                    /**
                     * Handles errors that occur on the database connection.
                     *
                     * Logs the error information to the console for debugging purposes.
                     *
                     * @param {Event} event - The error event containing details of the error
                     * @private
                     */
                    this.db.onerror = (event) => {
                        console.error('Database error:', event.target.error);
                    };

                    // Check if we need to create initial stores
                    if (!this.db.objectStoreNames.contains('namespaces') ||
                        !this.db.objectStoreNames.contains('default') ||
                        !this.db.objectStoreNames.contains('settings')) {

                        // Close current connection and reopen with increased version
                        const newVersion = this.db.version + 1;
                        this.db.close();

                        const upgradeRequest = indexedDB.open(this.DB_NAME, newVersion);

                        /**
                         * Handles database schema updates for new stores.
                         *
                         * @param {IDBEvent} event - The upgrade event
                         * @private
                         */
                        upgradeRequest.onupgradeneeded = (event) => {
                            const db = event.target.result;

                            if (!db.objectStoreNames.contains('namespaces')) {
                                const namespaceStore = db.createObjectStore('namespaces', { keyPath: 'name' });
                                namespaceStore.createIndex('created', 'created', { unique: false });
                                namespaceStore.createIndex('updated', 'updated', { unique: false });
                            }

                            if (!db.objectStoreNames.contains('default')) {
                                db.createObjectStore('default');
                            }

                            if (!db.objectStoreNames.contains('settings')) {
                                db.createObjectStore('settings');
                            }
                        };

                        /**
                         * Handles successful database upgrade request.
                         * Sets the database reference to the upgraded one and
                         * marks the storage adapter as ready.
                         *
                         * @param {Event} event - The success event
                         * @private
                         */
                        upgradeRequest.onsuccess = (event) => {
                            this.db = event.target.result;
                            this.ready = true;
                            resolve();
                        };

                        /**
                         * Handles database upgrade request errors.
                         * Rejects the promise with an error containing the
                         * database upgrade error message.
                         *
                         * @param {Event} event - The error event
                         * @private
                         */
                        upgradeRequest.onerror = (event) => {
                            reject(new Error('Failed to upgrade database: ' + event.target.error.message));
                        };
                    } else {
                        this.ready = true;
                        resolve();
                    }
                };
            });
        } catch (error) {
            throw new Error('Failed to initialize database: ' + error.message);
        }
    }

    /**
     * Ensures the database is initialized and a namespace exists.
     *
     * @private
     * @param {string} namespace - The namespace to ensure exists
     * @returns {Promise<void>}
     */
    async ensureReady(namespace) {
        if (!this.ready) {
            await this.initialize();
        }

        // Check if namespace exists and create if it doesn't
        const tx = this.db.transaction('namespaces', 'readwrite');
        const namespaceStore = tx.objectStore('namespaces');

        return new Promise((resolve, reject) => {
            const getRequest = namespaceStore.get(namespace);

            /**
             * Handles successful namespace retrieval.
             */
            getRequest.onsuccess = () => {
                if (!getRequest.result) {
                    // Namespace doesn't exist, create it
                    const timestamp = Date.now();
                    namespaceStore.add({
                        name: namespace,
                        created: timestamp,
                        updated: timestamp,
                    });

                    // Create namespace store if it doesn't exist
                    if (!this.db.objectStoreNames.contains(namespace)) {
                        // Close the database to modify its structure
                        this.db.close();
                        this.ready = false;

                        // Reopen with incremented version to add new store
                        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION + 1);

                        /**
                         * Handles database schema updates for new namespace.
                         *
                         * @param {IDBEvent} event - The upgrade event
                         * @private
                         */
                        request.onupgradeneeded = (event) => {
                            const db = event.target.result;
                            if (!db.objectStoreNames.contains(namespace)) {
                                db.createObjectStore(namespace);
                            }
                        };

                        /**
                         * Handles successful database reopen.
                         */
                        request.onsuccess = () => {
                            this.db = request.result;
                            this.ready = true;
                            resolve();
                        };

                        /**
                         * Handles database reopen errors.
                         */
                        request.onerror = () => {
                            reject(new Error(`Failed to create namespace: ${namespace}`));
                        };
                    } else {
                        resolve();
                    }
                } else {
                    resolve();
                }
            };

            /**
             * Handles namespace check errors.
             */
            getRequest.onerror = () => {
                reject(new Error('Failed to check namespace existence'));
            };
        });
    }

    /**
     * @inheritdoc
     *
     * @example
     * const value = await storage.get('user-preferences', 'settings');
     * console.log('Preferences:', value);
     */
    async get(key, namespace = 'default') {
        this.validateKey(key);
        this.validateNamespace(namespace);

        await this.ensureReady(namespace);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(namespace, 'readonly');
            const store = tx.objectStore(namespace);
            const request = store.get(key);

            /**
             * Handles successful value retrieval.
             */
            request.onsuccess = () => {
                const record = request.result;
                resolve(record ? record.value : null);
            };

            /**
             * Handles value retrieval errors.
             */
            request.onerror = () => {
                reject(new Error(`Failed to get value for key: ${key}`));
            };
        });
    }

    /**
     * @inheritdoc
     *
     * @example
     * await storage.set('user-preferences', { theme: 'dark' }, 'settings');
     */
    async set(key, value, namespace = 'default') {
        this.validateKey(key);
        this.validateValue(value);
        this.validateNamespace(namespace);

        await this.ensureReady(namespace);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(namespace, 'readwrite');
            const store = tx.objectStore(namespace);

            // First try to get existing record for metadata
            const getRequest = store.get(key);

            /**
             * Handles successful existing record check.
             */
            getRequest.onsuccess = () => {
                const existingRecord = getRequest.result;
                const record = {
                    value,
                    metadata: existingRecord ? this.updateMetadata(existingRecord.metadata) : this.createMetadata(),
                };

                const putRequest = store.put(record, key);

                /**
                 * Handles successful value storage.
                 *
                 * @returns {void}
                 */
                putRequest.onsuccess = () => resolve();

                /**
                 * Handles value storage errors.
                 */
                putRequest.onerror = () => {
                    reject(new Error(`Failed to set value for key: ${key}`));
                };
            };

            /**
             * Handles existing record check errors.
             */
            getRequest.onerror = () => {
                reject(new Error(`Failed to check existing value for key: ${key}`));
            };
        });
    }

    /**
     * @inheritdoc
     *
     * @example
     * await storage.delete('old-setting', 'settings');
     */
    async delete(key, namespace = 'default') {
        this.validateKey(key);
        this.validateNamespace(namespace);

        await this.ensureReady(namespace);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(namespace, 'readwrite');
            const store = tx.objectStore(namespace);
            const request = store.delete(key);

            /**
             * Handles successful deletion.
             *
             * @returns {void}
             */
            request.onsuccess = () => resolve();

            /**
             * Handles deletion errors.
             */
            request.onerror = () => {
                reject(new Error(`Failed to delete key: ${key}`));
            };
        });
    }

    /**
     * @inheritdoc
     *
     * @example
     * await storage.clear('settings');
     */
    async clear(namespace = 'default') {
        this.validateNamespace(namespace);

        await this.ensureReady(namespace);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(namespace, 'readwrite');
            const store = tx.objectStore(namespace);
            const request = store.clear();

            /**
             * Handles successful namespace clearing.
             *
             * @returns {void}
             */
            request.onsuccess = () => resolve();

            /**
             * Handles namespace clearing errors.
             */
            request.onerror = () => {
                reject(new Error(`Failed to clear namespace: ${namespace}`));
            };
        });
    }

    /**
     * @inheritdoc
     *
     * @example
     * const info = await storage.getStorageInfo();
     * console.log(`Storage usage: ${info.percentage}%`);
     */
    async getStorageInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage || 0,
                quota: estimate.quota || 0,
                percentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0,
            };
        }

        // Fallback for browsers without Storage API support
        return {
            used: 0,
            quota: 0,
            percentage: 0,
        };
    }

    /**
     * @inheritdoc
     *
     * @example
     * const namespaces = await storage.listNamespaces();
     * console.log('Available namespaces:', namespaces);
     */
    async listNamespaces() {
        await this.ensureReady('default');

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('namespaces', 'readonly');
            const store = tx.objectStore('namespaces');
            const request = store.getAllKeys();

            /**
             * Handles successful namespace listing.
             */
            request.onsuccess = () => {
                resolve(request.result);
            };

            /**
             * Handles namespace listing errors.
             */
            request.onerror = () => {
                reject(new Error('Failed to list namespaces'));
            };
        });
    }

    /**
     * @inheritdoc
     *
     * @example
     * const keys = await storage.listKeys('settings');
     * console.log('Available settings:', keys);
     */
    async listKeys(namespace = 'default') {
        this.validateNamespace(namespace);

        await this.ensureReady(namespace);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(namespace, 'readonly');
            const store = tx.objectStore(namespace);
            const request = store.getAllKeys();

            /**
             * Handles successful key listing.
             */
            request.onsuccess = () => {
                resolve(request.result);
            };

            /**
             * Handles key listing errors.
             */
            request.onerror = () => {
                reject(new Error(`Failed to list keys in namespace: ${namespace}`));
            };
        });
    }
}

export default BrowserStorageAdapter;
