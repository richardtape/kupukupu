/**
 * @file Base storage adapter that defines the interface for all storage implementations.
 * This abstract class provides the contract that all concrete storage implementations must fulfill,
 * ensuring consistent behavior across different runtime environments (browser/electron).
 *
 * The storage system uses namespaces to organize different types of data (settings, feeds, etc.)
 * and supports metadata for versioning and schema management. Each storage operation is validated
 * to ensure data integrity and consistent behavior.
 *
 * @module core/storage/StorageAdapter
 */

/**
 * @typedef {object} StorageMetadata
 * @property {number} version - The version number of the stored data
 * @property {number} created - Timestamp of when the data was first created
 * @property {number} updated - Timestamp of the last update
 * @property {string} schema - Identifier for the data schema used
 */

/**
 * @typedef {object} StorageInfo
 * @property {number} used - Number of bytes currently used
 * @property {number} quota - Maximum number of bytes available
 * @property {number} percentage - Percentage of quota used
 */

/**
 * Abstract base class for storage adapters. Implements core validation and provides
 * the interface that all storage implementations must follow.
 *
 * @abstract
 */
class StorageAdapter {
    /**
     * Creates a new StorageAdapter instance.
     *
     * @throws {Error} If instantiated directly (must be extended)
     *
     * @example
     * // This will throw an error
     * const adapter = new StorageAdapter();
     *
     * // Instead, use a concrete implementation
     * class MyStorage extends StorageAdapter {
     *   // Implementation here
     * }
     */
    constructor() {
        if (this.constructor === StorageAdapter) {
            throw new Error('StorageAdapter is abstract and cannot be instantiated directly');
        }
    }

    /**
     * Gets the current storage version.
     * This method should be implemented by storage-specific adapters.
     *
     * @abstract
     * @protected
     * @returns {Promise<number>} The current storage version
     * @throws {Error} If unable to get storage version
     *
     * @example
     * const version = await storage.getCurrentVersion();
     * console.log(`Current storage version: ${version}`);
     */
    async getCurrentVersion() {
        throw new Error('getCurrentVersion() must be implemented by subclass');
    }

    /**
     * Retrieves a value from storage.
     *
     * @abstract
     * @param {string} key - The key to retrieve
     * @param {string} namespace - The namespace to retrieve from
     * @returns {Promise<*>} The stored value
     * @throws {Error} If key or namespace is invalid
     *
     * @example
     * // Get a value from the default namespace
     * const value = await storage.get('my-key', 'default');
     *
     * // Get a value from a specific namespace
     * const settings = await storage.get('user-preferences', 'settings');
     */
    async get(key, namespace = 'default') {
        this.validateKey(key);
        this.validateNamespace(namespace);
        throw new Error('get() must be implemented by subclass');
    }

    /**
     * Stores a value in storage.
     *
     * @abstract
     * @param {string} key - The key to store under
     * @param {*} value - The value to store
     * @param {string} namespace - The namespace to store in
     * @returns {Promise<void>}
     * @throws {Error} If key, value, or namespace is invalid
     *
     * @example
     * // Store a value in the default namespace
     * await storage.set('my-key', { data: 'value' }, 'default');
     *
     * // Store settings in a specific namespace
     * await storage.set('user-preferences', { theme: 'dark' }, 'settings');
     */
    async set(key, value, namespace = 'default') {
        this.validateKey(key);
        this.validateValue(value);
        this.validateNamespace(namespace);
        throw new Error('set() must be implemented by subclass');
    }

    /**
     * Deletes a value from storage.
     *
     * @abstract
     * @param {string} key - The key to delete
     * @param {string} namespace - The namespace to delete from
     * @returns {Promise<void>}
     * @throws {Error} If key or namespace is invalid
     *
     * @example
     * // Delete a value from the default namespace
     * await storage.delete('my-key', 'default');
     *
     * // Delete settings from a specific namespace
     * await storage.delete('user-preferences', 'settings');
     */
    async delete(key, namespace = 'default') {
        this.validateKey(key);
        this.validateNamespace(namespace);
        throw new Error('delete() must be implemented by subclass');
    }

    /**
     * Clears all values from a namespace.
     *
     * @abstract
     * @param {string} namespace - The namespace to clear
     * @returns {Promise<void>}
     * @throws {Error} If namespace is invalid
     *
     * @example
     * // Clear all values from the default namespace
     * await storage.clear('default');
     *
     * // Clear all settings
     * await storage.clear('settings');
     */
    async clear(namespace = 'default') {
        this.validateNamespace(namespace);
        throw new Error('clear() must be implemented by subclass');
    }

    /**
     * Retrieves storage usage information.
     *
     * @abstract
     * @returns {Promise<StorageInfo>} Object containing storage usage details
     *
     * @example
     * const info = await storage.getStorageInfo();
     * console.log(`Using ${info.percentage}% of available storage`);
     */
    async getStorageInfo() {
        throw new Error('getStorageInfo() must be implemented by subclass');
    }

    /**
     * Lists all existing namespaces.
     *
     * @abstract
     * @returns {Promise<string[]>} Array of namespace names
     *
     * @example
     * const namespaces = await storage.listNamespaces();
     * console.log('Available namespaces:', namespaces);
     */
    async listNamespaces() {
        throw new Error('listNamespaces() must be implemented by subclass');
    }

    /**
     * Lists all keys in a namespace.
     *
     * @abstract
     * @param {string} namespace - The namespace to list keys from
     * @returns {Promise<string[]>} Array of keys
     * @throws {Error} If namespace is invalid
     *
     * @example
     * const keys = await storage.listKeys('settings');
     * console.log('Available settings:', keys);
     */
    async listKeys(namespace = 'default') {
        this.validateNamespace(namespace);
        throw new Error('listKeys() must be implemented by subclass');
    }

    /**
     * Validates a storage key.
     *
     * @protected
     * @param {string} key - The key to validate
     * @throws {Error} If key is invalid
     *
     * @example
     * storage.validateKey('valid-key_123'); // Valid
     * storage.validateKey('invalid key!'); // Throws Error
     */
    validateKey(key) {
        if (typeof key !== 'string') {
            throw new Error('Storage key must be a string');
        }
        if (key.length === 0) {
            throw new Error('Storage key cannot be empty');
        }
        if (key.length > 255) {
            throw new Error('Storage key cannot be longer than 255 characters');
        }
        // Only allow alphanumeric characters, dashes, and underscores
        if (!/^[a-zA-Z0-9-_]+$/.test(key)) {
            throw new Error('Storage key can only contain alphanumeric characters, dashes, and underscores');
        }
    }

    /**
     * Validates a namespace.
     *
     * @protected
     * @param {string} namespace - The namespace to validate
     * @throws {Error} If namespace is invalid
     *
     * @example
     * storage.validateNamespace('settings'); // Valid
     * storage.validateNamespace('invalid!space'); // Throws Error
     */
    validateNamespace(namespace) {
        if (typeof namespace !== 'string') {
            throw new Error('Namespace must be a string');
        }
        if (namespace.length === 0) {
            throw new Error('Namespace cannot be empty');
        }
        if (namespace.length > 50) {
            throw new Error('Namespace cannot be longer than 50 characters');
        }
        // Only allow lowercase alphanumeric characters and dashes
        if (!/^[a-z0-9-]+$/.test(namespace)) {
            throw new Error('Namespace can only contain lowercase alphanumeric characters and dashes');
        }
    }

    /**
     * Validates a value before storage.
     *
     * @protected
     * @param {*} value - The value to validate
     * @throws {Error} If value is invalid
     *
     * @example
     * storage.validateValue({ valid: 'data' }); // Valid
     * storage.validateValue(undefined); // Throws Error
     */
    validateValue(value) {
        if (value === undefined) {
            throw new Error('Storage value cannot be undefined');
        }

        // First check if it's a function, which we know isn't serializable
        if (typeof value === 'function') {
            throw new Error('Storage value must be JSON serializable');
        }

        // Then try to serialize to JSON
        try {
            JSON.stringify(value);
        } catch {
            throw new Error('Storage value must be JSON serializable');
        }
    }

    /**
     * Creates metadata for a stored value.
     *
     * @protected
     * @param {string} schema - The schema identifier for the value
     * @returns {StorageMetadata} Metadata object
     *
     * @example
     * const metadata = storage.createMetadata('settings-v1');
     * console.log(metadata.version); // 1
     */
    createMetadata(schema = 'default') {
        const timestamp = Date.now();
        return {
            version: 1,
            created: timestamp,
            updated: timestamp,
            schema,
        };
    }

    /**
     * Updates metadata for a stored value.
     *
     * @protected
     * @param {StorageMetadata} metadata - The existing metadata
     * @param {string} [schema] - Optional new schema identifier
     * @returns {StorageMetadata} Updated metadata object
     *
     * @example
     * const updated = storage.updateMetadata(existingMetadata, 'settings-v2');
     * console.log(updated.version); // Incremented version number
     */
    updateMetadata(metadata, schema) {
        return {
            ...metadata,
            updated: Date.now(),
            schema: schema || metadata.schema,
            version: metadata.version + 1,
        };
    }
}

export default StorageAdapter;
