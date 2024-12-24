// tests/setup/indexeddb.mock.js
class IDBRequest {
    constructor() {
        this.result = null;
        this.error = null;
        this.source = null;
        this.transaction = null;
        this.readyState = 'pending';
        this.onsuccess = null;
        this.onerror = null;
    }
}

class IDBOpenDBRequest extends IDBRequest {
    constructor() {
        super();
        this.onupgradeneeded = null;
        this.onblocked = null;
    }
}

class IDBObjectStore {
    constructor(name) {
        this.name = name;
        this._data = new Map();
    }

    createIndex() { return {}; }

    add(value) {
        const request = new IDBRequest();
        setTimeout(() => {
            this._data.set(value.name || value.key, value);
            request.result = value.name || value.key;
            request.onsuccess && request.onsuccess({ target: request });
        }, 0);
        return request;
    }

    put(value, key) {
        const request = new IDBRequest();
        setTimeout(() => {
            this._data.set(key, value);
            request.result = key;
            request.onsuccess && request.onsuccess({ target: request });
        }, 0);
        return request;
    }

    get(key) {
        const request = new IDBRequest();
        setTimeout(() => {
            request.result = this._data.get(key);
            request.onsuccess && request.onsuccess({ target: request });
        }, 0);
        return request;
    }

    delete(key) {
        const request = new IDBRequest();
        setTimeout(() => {
            this._data.delete(key);
            request.onsuccess && request.onsuccess({ target: request });
        }, 0);
        return request;
    }

    clear() {
        const request = new IDBRequest();
        setTimeout(() => {
            this._data.clear();
            request.onsuccess && request.onsuccess({ target: request });
        }, 0);
        return request;
    }

    getAllKeys() {
        const request = new IDBRequest();
        setTimeout(() => {
            request.result = Array.from(this._data.keys());
            request.onsuccess && request.onsuccess({ target: request });
        }, 0);
        return request;
    }
}

class IDBTransaction {
    constructor(db, storeNames, mode) {
        this.db = db;
        this.storeNames = storeNames;
        this.mode = mode;
        this.oncomplete = null;
        this.onerror = null;
    }

    objectStore(name) {
        return this.db._stores.get(name);
    }
}

class IDBDatabase {
    constructor() {
        this._stores = new Map();
        this.objectStoreNames = {
            contains: (name) => this._stores.has(name),
        };
        this.version = 1;
    }

    close() {}

    createObjectStore(name) {
        const store = new IDBObjectStore(name);
        this._stores.set(name, store);
        return store;
    }

    transaction(storeNames, mode = 'readonly') {
        return new IDBTransaction(this, storeNames, mode);
    }
}

const indexedDB = {
    _databases: new Map(),

    open(name, version) {
        const request = new IDBOpenDBRequest();
        setTimeout(() => {
            const db = this._databases.get(name) || new IDBDatabase();
            this._databases.set(name, db);
            request.result = db;

            if (request.onupgradeneeded) {
                request.transaction = new IDBTransaction(db, [], 'versionchange');
                request.onupgradeneeded({ target: request });
            }

            request.onsuccess && request.onsuccess({ target: request });
        }, 0);
        return request;
    }
};

global.indexedDB = indexedDB;
global.IDBRequest = IDBRequest;
global.IDBOpenDBRequest = IDBOpenDBRequest;
global.IDBDatabase = IDBDatabase;
global.IDBObjectStore = IDBObjectStore;
global.IDBTransaction = IDBTransaction;
