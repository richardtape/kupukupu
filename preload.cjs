const { contextBridge, ipcRenderer } = require('electron');

/**
 * Object containing storage-related IPC functions.
 *
 * @typedef {object} StorageAPI
 * @property {function(string, any[]): Promise<any>} run - Executes a SQL query
 * @property {function(string, any[]): Promise<any>} get - Retrieves a single row
 * @property {function(string, any[]): Promise<any[]>} all - Retrieves multiple rows
 * @property {function(): Promise<{size: number}>} getDatabaseSize - Gets database size
 */

/**
 * Object containing Electron-specific APIs exposed to the renderer process.
 *
 * @typedef {object} ElectronAPI
 * @property {boolean} isElectron - Indicates if running in Electron
 * @property {StorageAPI} storage - Storage-related functions
 */

/**
 * Exposes Electron-specific APIs to the renderer process.
 * These APIs are made available through the window.electronAPI object.
 *
 * @example
 * // In renderer process:
 * if (window.electronAPI?.isElectron) {
 *   const result = await window.electronAPI.storage.get('SELECT * FROM table WHERE id = ?', [1]);
 * }
 */
contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    storage: {
        /**
         * Executes a SQL query with optional parameters.
         *
         * @param {string} query - The SQL query to execute
         * @param {any[]} [params] - Query parameters
         * @returns {Promise<any>} Query result
         *
         * @example
         * // Insert a new record
         * await window.electronAPI.storage.run(
         *   'INSERT INTO users (name, email) VALUES (?, ?)',
         *   ['John Doe', 'john@example.com']
         * );
         */
        run: (query, params) => ipcRenderer.invoke('storage:run', query, params),

        /**
         * Retrieves a single row using a SQL query.
         *
         * @param {string} query - The SQL query to execute
         * @param {any[]} [params] - Query parameters
         * @returns {Promise<any>} Query result
         *
         * @example
         * // Get a user by ID
         * const user = await window.electronAPI.storage.get(
         *   'SELECT * FROM users WHERE id = ?',
         *   [1]
         * );
         */
        get: (query, params) => ipcRenderer.invoke('storage:get', query, params),

        /**
         * Retrieves all rows matching a SQL query.
         *
         * @param {string} query - The SQL query to execute
         * @param {any[]} [params] - Query parameters
         * @returns {Promise<any[]>} Query results
         *
         * @example
         * // Get all active users
         * const activeUsers = await window.electronAPI.storage.all(
         *   'SELECT * FROM users WHERE active = ?',
         *   [true]
         * );
         */
        all: (query, params) => ipcRenderer.invoke('storage:all', query, params),

        /**
         * Gets the current size of the SQLite database.
         *
         * @returns {Promise<{size: number}>} Object containing database size in bytes
         *
         * @example
         * // Get database size
         * const { size } = await window.electronAPI.storage.getDatabaseSize();
         * console.log(`Database size: ${size} bytes`);
         */
        getDatabaseSize: () => ipcRenderer.invoke('storage:getSize')
    }
});
