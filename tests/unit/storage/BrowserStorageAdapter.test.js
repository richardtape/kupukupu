import BrowserStorageAdapter from '../../../src/js/core/storage/BrowserStorageAdapter.js';

describe('BrowserStorageAdapter', () => {
    let storage;

    beforeEach(async () => {
        // Create a fresh instance before each test
        storage = new BrowserStorageAdapter();
        await storage.initialize();
    });

    afterEach(async () => {
        // Clean up after each test
        if (storage.db) {
            const namespaces = await storage.listNamespaces();
            for (const namespace of namespaces) {
                await storage.clear(namespace);
            }
            storage.db.close();
        }
        storage = null;
        // Clear all databases
        indexedDB._databases.clear();
    });

    describe('Initialization', () => {
        test('creates required object stores on first initialization', async () => {
            const db = storage.db;
            expect(db.objectStoreNames.contains('namespaces')).toBe(true);
            expect(db.objectStoreNames.contains('default')).toBe(true);
            expect(db.objectStoreNames.contains('settings')).toBe(true);
        });

        test('does not recreate stores on subsequent initialization', async () => {
            // Initialize a second time
            await storage.initialize();
            expect(storage.ready).toBe(true);
        });

        test('can get database version', async () => {
            const version = await storage.getCurrentVersion();
            expect(version).toBe(1);
        });
    });

    describe('Basic Operations', () => {
        test('can store and retrieve a value', async () => {
            const testKey = 'test-key';
            const testValue = { hello: 'world' };

            await storage.set(testKey, testValue);
            const retrieved = await storage.get(testKey);

            expect(retrieved).toEqual(testValue);
        });

        test('returns null for non-existent keys', async () => {
            const value = await storage.get('non-existent');
            expect(value).toBeNull();
        });

        test('can delete a value', async () => {
            const testKey = 'test-key';
            const testValue = { hello: 'world' };

            await storage.set(testKey, testValue);
            await storage.delete(testKey);

            const retrieved = await storage.get(testKey);
            expect(retrieved).toBeNull();
        });

        test('can clear all values in a namespace', async () => {
            await storage.set('key1', 'value1');
            await storage.set('key2', 'value2');

            await storage.clear();

            const value1 = await storage.get('key1');
            const value2 = await storage.get('key2');

            expect(value1).toBeNull();
            expect(value2).toBeNull();
        });
    });

    describe('Namespace Handling', () => {
        test('creates new namespace when accessing it first time', async () => {
            const testNamespace = 'test-namespace';
            await storage.set('test-key', 'test-value', testNamespace);

            const namespaces = await storage.listNamespaces();
            expect(namespaces).toContain(testNamespace);
        });

        test('can list keys in a namespace', async () => {
            const testNamespace = 'test-namespace';
            await storage.set('key1', 'value1', testNamespace);
            await storage.set('key2', 'value2', testNamespace);

            const keys = await storage.listKeys(testNamespace);
            expect(keys).toEqual(expect.arrayContaining(['key1', 'key2']));
        });

        test('namespaces are isolated', async () => {
            await storage.set('key', 'value1', 'namespace1');
            await storage.set('key', 'value2', 'namespace2');

            const value1 = await storage.get('key', 'namespace1');
            const value2 = await storage.get('key', 'namespace2');

            expect(value1).toBe('value1');
            expect(value2).toBe('value2');
        });

        test('clearing one namespace doesnt affect others', async () => {
            await storage.set('key', 'value1', 'namespace1');
            await storage.set('key', 'value2', 'namespace2');

            await storage.clear('namespace1');

            const value1 = await storage.get('key', 'namespace1');
            const value2 = await storage.get('key', 'namespace2');

            expect(value1).toBeNull();
            expect(value2).toBe('value2');
        });
    });

    describe('Storage Info', () => {
        test('returns storage information', async () => {
            const info = await storage.getStorageInfo();

            expect(info).toHaveProperty('used');
            expect(info).toHaveProperty('quota');
            expect(info).toHaveProperty('percentage');

            expect(typeof info.used).toBe('number');
            expect(typeof info.quota).toBe('number');
            expect(typeof info.percentage).toBe('number');
        });
    });

    describe('Error Handling', () => {
        test('handles initialization errors', async () => {
            // Reset storage instance
            storage.db.close();
            storage.ready = false;

            // Mock an error in indexedDB.open
            const originalOpen = indexedDB.open;
            indexedDB.open = () => {
                const request = new IDBOpenDBRequest();
                setTimeout(() => {
                    request.error = new Error('Failed to open database');
                    request.onerror && request.onerror({ target: request });
                }, 0);
                return request;
            };

            await expect(storage.initialize()).rejects.toThrow('Failed to open database');

            // Restore original open function
            indexedDB.open = originalOpen;
        });

        test('handles database versioning error', async () => {
            // Reset storage instance
            storage.db.close();
            storage.ready = false;

            // Mock version error
            const originalOpen = indexedDB.open;
            indexedDB.open = () => {
                throw new Error('Version error');
            };

            await expect(storage.getCurrentVersion()).rejects.toThrow('Version error');

            // Restore original open function
            indexedDB.open = originalOpen;
        });

        test('validates input before operations', async () => {
            await expect(storage.set(null, 'value')).rejects.toThrow();
            await expect(storage.get(null)).rejects.toThrow();
            await expect(storage.delete(null)).rejects.toThrow();
            await expect(storage.clear('Invalid Namespace!')).rejects.toThrow();
        });

        test('handles transaction errors', async () => {
            // Mock a transaction error
            const db = storage.db;
            const originalTransaction = db.transaction.bind(db);
            db.transaction = () => {
                throw new Error('Transaction failed');
            };

            await expect(storage.get('test-key')).rejects.toThrow('Transaction failed');

            // Restore original transaction function
            db.transaction = originalTransaction;
        });

    });
});