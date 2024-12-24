import StorageAdapter from '../../../src/js/core/storage/StorageAdapter.js';

// Create a concrete implementation for testing
class TestStorageAdapter extends StorageAdapter {
    async getCurrentVersion() { return 1; }
    async get() { return null; }
    async set() { return null; }
    async delete() { return null; }
    async clear() { return null; }
    async getStorageInfo() { return { used: 0, quota: 0, percentage: 0 }; }
    async listNamespaces() { return []; }
    async listKeys() { return []; }
}

// Create an incomplete implementation for testing abstract method enforcement
class IncompleteAdapter extends StorageAdapter {}

describe('StorageAdapter', () => {
    let storage;

    beforeEach(() => {
        storage = new TestStorageAdapter();
    });

    describe('Constructor', () => {
        test('cannot instantiate abstract StorageAdapter directly', () => {
            expect(() => new StorageAdapter()).toThrow('StorageAdapter is abstract');
        });

        test('can instantiate concrete implementation', () => {
            expect(() => new TestStorageAdapter()).not.toThrow();
        });
    });

    describe('Key Validation', () => {
        test('accepts valid keys', () => {
            const validKeys = ['test', 'test-key', 'test_key', 'testKey123'];
            validKeys.forEach(key => {
                expect(() => storage.validateKey(key)).not.toThrow();
            });
        });

        test('rejects non-string keys', () => {
            const invalidKeys = [123, true, {}, [], null, undefined];
            invalidKeys.forEach(key => {
                expect(() => storage.validateKey(key)).toThrow('must be a string');
            });
        });

        test('rejects empty keys', () => {
            expect(() => storage.validateKey('')).toThrow('cannot be empty');
        });

        test('rejects keys longer than 255 characters', () => {
            const longKey = 'a'.repeat(256);
            expect(() => storage.validateKey(longKey)).toThrow('longer than 255');
        });

        test('rejects keys with invalid characters', () => {
            const invalidKeys = ['test key', 'test!key', 'test@key', 'test/key'];
            invalidKeys.forEach(key => {
                expect(() => storage.validateKey(key)).toThrow('can only contain');
            });
        });
    });

    describe('Namespace Validation', () => {
        test('accepts valid namespaces', () => {
            const validNamespaces = ['default', 'settings', 'test-namespace'];
            validNamespaces.forEach(namespace => {
                expect(() => storage.validateNamespace(namespace)).not.toThrow();
            });
        });

        test('rejects non-string namespaces', () => {
            const invalidNamespaces = [123, true, {}, [], null, undefined];
            invalidNamespaces.forEach(namespace => {
                expect(() => storage.validateNamespace(namespace)).toThrow('must be a string');
            });
        });

        test('rejects empty namespaces', () => {
            expect(() => storage.validateNamespace('')).toThrow('cannot be empty');
        });

        test('rejects namespaces longer than 50 characters', () => {
            const longNamespace = 'a'.repeat(51);
            expect(() => storage.validateNamespace(longNamespace)).toThrow('longer than 50');
        });

        test('rejects namespaces with invalid characters', () => {
            const invalidNamespaces = ['Test', 'test_space', 'test@space', 'test/space'];
            invalidNamespaces.forEach(namespace => {
                expect(() => storage.validateNamespace(namespace)).toThrow('can only contain');
            });
        });
    });

    describe('Value Validation', () => {
        test('accepts valid values', () => {
            const validValues = [
                'test',
                123,
                true,
                { test: 'value' },
                ['test'],
                null
            ];
            validValues.forEach(value => {
                expect(() => storage.validateValue(value)).not.toThrow();
            });
        });

        test('rejects undefined values', () => {
            expect(() => storage.validateValue(undefined)).toThrow('cannot be undefined');
        });

        test('rejects non-serializable values', () => {
            const circular = {};
            circular.self = circular;

            expect(() => storage.validateValue(circular)).toThrow(/JSON/);

            const fn = function() {};
            expect(() => storage.validateValue(fn)).toThrow(/JSON/);
        });
    });

    describe('Metadata Management', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('creates metadata with correct structure', () => {
            const schema = 'test-schema';
            const metadata = storage.createMetadata(schema);

            expect(metadata).toEqual({
                version: 1,
                created: expect.any(Number),
                updated: expect.any(Number),
                schema
            });

            // Created and updated should be the same timestamp
            expect(metadata.created).toBe(metadata.updated);
        });

        test('creates metadata with default schema', () => {
            const metadata = storage.createMetadata();
            expect(metadata.schema).toBe('default');
        });

        test('updates metadata correctly', () => {
            const original = storage.createMetadata('test-schema');

            // Advance timers by 1ms to ensure different timestamps
            jest.advanceTimersByTime(1);

            const updated = storage.updateMetadata(original);

            expect(updated).toEqual({
                ...original,
                version: original.version + 1,
                updated: expect.any(Number)
            });

            // Updated timestamp should be different
            expect(updated.updated).toBeGreaterThan(original.updated);
            // Created timestamp should not change
            expect(updated.created).toBe(original.created);
        });

        test('updates metadata with new schema', () => {
            const original = storage.createMetadata('old-schema');
            const newSchema = 'new-schema';
            const updated = storage.updateMetadata(original, newSchema);

            expect(updated.schema).toBe(newSchema);
        });
    });

    describe('Abstract Method Implementation', () => {
        let incomplete;

        beforeEach(() => {
            incomplete = new IncompleteAdapter();
        });

        test('concrete implementation must override getCurrentVersion', async () => {
            await expect(incomplete.getCurrentVersion()).rejects.toThrow('must be implemented');
        });

        test('concrete implementation must override get', async () => {
            await expect(incomplete.get('test')).rejects.toThrow('must be implemented');
        });

        test('concrete implementation must override set', async () => {
            await expect(incomplete.set('test', 'value')).rejects.toThrow('must be implemented');
        });

        test('concrete implementation must override delete', async () => {
            await expect(incomplete.delete('test')).rejects.toThrow('must be implemented');
        });

        test('concrete implementation must override clear', async () => {
            await expect(incomplete.clear()).rejects.toThrow('must be implemented');
        });

        test('concrete implementation must override getStorageInfo', async () => {
            await expect(incomplete.getStorageInfo()).rejects.toThrow('must be implemented');
        });

        test('concrete implementation must override listNamespaces', async () => {
            await expect(incomplete.listNamespaces()).rejects.toThrow('must be implemented');
        });

        test('concrete implementation must override listKeys', async () => {
            await expect(incomplete.listKeys()).rejects.toThrow('must be implemented');
        });
    });
});
