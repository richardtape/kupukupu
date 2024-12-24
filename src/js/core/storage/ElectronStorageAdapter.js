/**
 * @file Electron storage adapter implementation using SQLite.
 * This implementation handles all SQLite-specific operations while maintaining
 * the interface defined by StorageAdapter.
 *
 * @module core/storage/ElectronStorageAdapter
 */

import StorageAdapter from './StorageAdapter.js';

/** @typedef {import('./StorageAdapter.js').StorageMetadata} StorageMetadata */

/**
 * @typedef {object} StorageRecord
 * @property {*} value - The stored value
 * @property {StorageMetadata} metadata - Metadata about the stored value
 */

/**
 * Electron-specific storage adapter implementation using SQLite.
 */
class ElectronStorageAdapter extends StorageAdapter {
    /**
     * Creates a new ElectronStorageAdapter instance.
     *
     * @example
     * const storage = new ElectronStorageAdapter();
     * await storage.initialize();
     */
    constructor() {
        super();
        this.ready = false;
    }

    /**
     * Gets the current SQLite database version using user_version pragma.
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
        try {
            const result = await window.electronAPI.storage.get(
                'PRAGMA user_version'
            );
            return result?.user_version ?? 1;
        } catch (error) {
            throw new Error('Failed to get database version: ' + error.message);
        }
    }

    /**
     * Initializes the SQLite database and creates required tables.
     * Must be called before any other operations.
     *
     * @returns {Promise<void>}
     * @throws {Error} If database initialization fails
     *
     * @example
     * const storage = new ElectronStorageAdapter();
     * try {
     *   await storage.initialize();
     *   console.log('Storage initialized');
     * } catch (error) {
     *   console.error('Failed to initialize storage:', error);
     * }
     */
    async initialize() {
        if (this.ready) return;

        // Create namespaces table
        const createNamespacesTable = `
            CREATE TABLE IF NOT EXISTS namespaces (
                name TEXT PRIMARY KEY,
                created INTEGER NOT NULL,
                updated INTEGER NOT NULL
            )
        `;

        // Create default namespace table
        const createDefaultTable = `
            CREATE TABLE IF NOT EXISTS default_namespace (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                metadata TEXT NOT NULL
            )
        `;

        // Create settings namespace table
        const createSettingsTable = `
            CREATE TABLE IF NOT EXISTS namespace_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                metadata TEXT NOT NULL
            )
        `;

        try {
            // Pass null for params when no parameters are needed
            await window.electronAPI.storage.run(createNamespacesTable, null);
            await window.electronAPI.storage.run(createDefaultTable, null);
            await window.electronAPI.storage.run(createSettingsTable, null);
            this.ready = true;
        } catch (error) {
            throw new Error('Failed to initialize storage: ' + error.message);
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

        const tableName = this.getTableName(namespace);
        const now = Date.now();

        try {
            // Check if namespace exists
            const result = await window.electronAPI.storage.get(
                'SELECT name FROM namespaces WHERE name = ?',
                [namespace]
            );

            if (!result) {
                // Create namespace record
                await window.electronAPI.storage.run(
                    'INSERT INTO namespaces (name, created, updated) VALUES (?, ?, ?)',
                    [namespace, now, now]
                );

                // Create namespace table
                const createNamespaceTable = `
                    CREATE TABLE IF NOT EXISTS ${tableName} (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL,
                        metadata TEXT NOT NULL
                    )
                `;
                await window.electronAPI.storage.run(createNamespaceTable);
            }
        } catch (error) {
            throw new Error(`Failed to ensure namespace ${namespace}: ${error.message}`);
        }
    }

    /**
     * Gets the SQLite table name for a namespace.
     *
     * @private
     * @param {string} namespace - The namespace
     * @returns {string} The table name
     */
    getTableName(namespace) {
        return namespace === 'default' ? 'default_namespace' : `namespace_${namespace}`;
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

        const tableName = this.getTableName(namespace);
        try {
            const row = await window.electronAPI.storage.get(
                `SELECT value FROM ${tableName} WHERE key = ?`,
                [key]
            );

            if (!row) return null;

            const record = JSON.parse(row.value);
            return record.value;
        } catch (error) {
            throw new Error(`Failed to get value for key ${key}: ${error.message}`);
        }
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

        const tableName = this.getTableName(namespace);
        try {
            // Check for existing record to handle metadata
            const existingRow = await window.electronAPI.storage.get(
                `SELECT value FROM ${tableName} WHERE key = ?`,
                [key]
            );

            // Prepare record with metadata
            const record = {
                value,
                metadata: existingRow
                    ? this.updateMetadata(JSON.parse(existingRow.value).metadata)
                    : this.createMetadata()
            };

            // Insert or update the record
            await window.electronAPI.storage.run(
                `INSERT OR REPLACE INTO ${tableName} (key, value, metadata) VALUES (?, ?, ?)`,
                [key, JSON.stringify(record), JSON.stringify(record.metadata)]
            );
        } catch (error) {
            throw new Error(`Failed to set value for key ${key}: ${error.message}`);
        }
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

        const tableName = this.getTableName(namespace);
        try {
            await window.electronAPI.storage.run(
                `DELETE FROM ${tableName} WHERE key = ?`,
                [key]
            );
        } catch (error) {
            throw new Error(`Failed to delete key ${key}: ${error.message}`);
        }
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

        const tableName = this.getTableName(namespace);
        try {
            await window.electronAPI.storage.run(`DELETE FROM ${tableName}`);
        } catch (error) {
            throw new Error(`Failed to clear namespace ${namespace}: ${error.message}`);
        }
    }

    /**
     * @inheritdoc
     *
     * @example
     * const info = await storage.getStorageInfo();
     * console.log(`Storage usage: ${info.percentage}%`);
     */
    async getStorageInfo() {
        try {
            const info = await window.electronAPI.storage.getDatabaseSize();
            return {
                used: info.size,
                quota: Number.MAX_SAFE_INTEGER, // SQLite limit is file system size
                percentage: 0 // Not meaningful for SQLite
            };
        } catch (error) {
            console.warn('Failed to get storage info:', error.message);
            // Return empty info if we can't get size
            return {
                used: 0,
                quota: 0,
                percentage: 0
            };
        }
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

        try {
            const rows = await window.electronAPI.storage.all(
                'SELECT name FROM namespaces ORDER BY name'
            );
            return rows.map(row => row.name);
        } catch (error) {
            throw new Error('Failed to list namespaces: ' + error.message);
        }
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

        const tableName = this.getTableName(namespace);
        try {
            const rows = await window.electronAPI.storage.all(
                `SELECT key FROM ${tableName} ORDER BY key`
            );
            return rows.map(row => row.key);
        } catch (error) {
            throw new Error(`Failed to list keys in namespace ${namespace}: ${error.message}`);
        }
    }
}

export default ElectronStorageAdapter;
