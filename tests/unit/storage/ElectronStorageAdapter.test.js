import ElectronStorageAdapter from '../../../src/js/core/storage/ElectronStorageAdapter.js';

describe('ElectronStorageAdapter', () => {
    let storage;
    let mockIPC;

    beforeEach(() => {
        // Create mock IPC functions
        mockIPC = {
            storage: {
                run: jest.fn().mockResolvedValue(null),
                get: jest.fn().mockResolvedValue(null),
                all: jest.fn().mockResolvedValue([]),
                getDatabaseSize: jest.fn().mockResolvedValue({ size: 0 })
            }
        };

        // Mock window.electronAPI
        window.electronAPI = mockIPC;

        storage = new ElectronStorageAdapter();
    });

    afterEach(() => {
        jest.clearAllMocks();
        window.electronAPI = undefined;
    });

    describe('Initialization', () => {
        test('creates required tables on first initialization', async () => {
            await storage.initialize();

            expect(mockIPC.storage.run).toHaveBeenCalledTimes(3);
            expect(mockIPC.storage.run.mock.calls[0][0]).toMatch(/CREATE TABLE.*namespaces/);
            expect(mockIPC.storage.run.mock.calls[1][0]).toMatch(/CREATE TABLE.*default_namespace/);
            expect(mockIPC.storage.run.mock.calls[2][0]).toMatch(/CREATE TABLE.*namespace_settings/);
            expect(storage.ready).toBe(true);
        });

        test('handles initialization errors', async () => {
            const error = new Error('DB Error');
            mockIPC.storage.run.mockRejectedValueOnce(error);

            await expect(storage.initialize()).rejects.toThrow('Failed to initialize storage');
            expect(storage.ready).toBe(false);
        });

        test('does nothing if already initialized', async () => {
            await storage.initialize();
            await storage.initialize();

            expect(mockIPC.storage.run).toHaveBeenCalledTimes(3); // Only from first init
        });
    });

    describe('Basic Operations', () => {
        beforeEach(async () => {
            await storage.initialize();
            jest.clearAllMocks(); // Clear initialization calls
        });

        test('can store and retrieve a value', async () => {
            const testKey = 'test-key';
            const testValue = { hello: 'world' };

            // First get call for namespace check
            mockIPC.storage.get
                .mockResolvedValueOnce({ name: 'default' })
                // Second get call to check for existing value (for metadata)
                .mockResolvedValueOnce(null)
                // Third get call when retrieving the value back
                .mockResolvedValueOnce({ name: 'default' })
                .mockResolvedValueOnce({
                    value: JSON.stringify({
                        value: testValue,
                        metadata: {
                            version: 1,
                            created: Date.now(),
                            updated: Date.now(),
                            schema: 'default'
                        }
                    })
                });

            await storage.set(testKey, testValue);
            const retrieved = await storage.get(testKey);

            expect(retrieved).toEqual(testValue);
        });

        test('returns null for non-existent keys', async () => {
            // Mock successful namespace check
            mockIPC.storage.get.mockResolvedValueOnce({ name: 'default' });
            // Mock no value found
            mockIPC.storage.get.mockResolvedValueOnce(null);

            const value = await storage.get('non-existent');
            expect(value).toBeNull();
        });

        test('can delete a value', async () => {
            // Mock successful namespace check
            mockIPC.storage.get.mockResolvedValueOnce({ name: 'default' });

            await storage.delete('test-key');

            expect(mockIPC.storage.run).toHaveBeenCalledWith(
                expect.stringMatching(/DELETE FROM.*default_namespace.*WHERE key = \?/),
                ['test-key']
            );
        });

        test('can clear all values in a namespace', async () => {
            // Mock successful namespace check
            mockIPC.storage.get.mockResolvedValueOnce({ name: 'test-namespace' });

            await storage.clear('test-namespace');

            // Only check the SQL query part
            const lastCall = mockIPC.storage.run.mock.calls.pop();
            expect(lastCall[0]).toMatch(/DELETE FROM.*namespace_test-namespace/);
        });
    });

    describe('Namespace Handling', () => {
        beforeEach(async () => {
            await storage.initialize();
            jest.clearAllMocks();
        });

        test('creates namespace on first use', async () => {
            // Mock namespace doesn't exist
            mockIPC.storage.get.mockResolvedValueOnce(null);

            await storage.ensureReady('test-namespace');

            expect(mockIPC.storage.run).toHaveBeenCalledWith(
                expect.stringMatching(/INSERT INTO namespaces/),
                expect.arrayContaining(['test-namespace'])
            );
        });

        test('can list namespaces', async () => {
            const mockNamespaces = [
                { name: 'default' },
                { name: 'settings' }
            ];
            mockIPC.storage.all.mockResolvedValueOnce(mockNamespaces);

            const namespaces = await storage.listNamespaces();

            expect(namespaces).toEqual(['default', 'settings']);
        });

        test('can list keys in namespace', async () => {
            const mockKeys = [
                { key: 'key1' },
                { key: 'key2' }
            ];
            // Mock successful namespace check
            mockIPC.storage.get.mockResolvedValueOnce({ name: 'test-namespace' });
            mockIPC.storage.all.mockResolvedValueOnce(mockKeys);

            const keys = await storage.listKeys('test-namespace');

            expect(keys).toEqual(['key1', 'key2']);
        });
    });

    describe('Storage Info', () => {
        test('returns storage information', async () => {
            const mockSize = { size: 1024 };
            mockIPC.storage.getDatabaseSize.mockResolvedValueOnce(mockSize);

            const info = await storage.getStorageInfo();

            expect(info).toEqual({
                used: 1024,
                quota: Number.MAX_SAFE_INTEGER,
                percentage: 0
            });
        });

        test('handles storage info errors gracefully', async () => {
            // Spy on console.warn to suppress the warning message
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            mockIPC.storage.getDatabaseSize.mockRejectedValueOnce(new Error('Failed to get size'));

            const info = await storage.getStorageInfo();

            expect(info).toEqual({
                used: 0,
                quota: 0,
                percentage: 0
            });

            warnSpy.mockRestore();
        });
    });

    describe('Error Handling', () => {
        beforeEach(async () => {
            await storage.initialize();
            jest.clearAllMocks();
        });

        test('handles get operation errors', async () => {
            // Mock namespace exists but get fails
            mockIPC.storage.get
                .mockResolvedValueOnce({ name: 'default' }) // namespace check succeeds
                .mockRejectedValueOnce(new Error('DB Error')); // get operation fails

            await expect(storage.get('test-key')).rejects.toThrow('Failed to get value for key');
        });

        test('handles set operation errors', async () => {
            // Mock namespace exists but set fails
            mockIPC.storage.get.mockResolvedValueOnce({ name: 'default' });
            mockIPC.storage.run.mockRejectedValueOnce(new Error('DB Error'));

            await expect(storage.set('test-key', 'value')).rejects.toThrow('Failed to set value for key');
        });

        test('handles delete operation errors', async () => {
            // Mock namespace exists but delete fails
            mockIPC.storage.get.mockResolvedValueOnce({ name: 'default' });
            mockIPC.storage.run.mockRejectedValueOnce(new Error('DB Error'));

            await expect(storage.delete('test-key')).rejects.toThrow('Failed to delete key');
        });

        test('handles clear operation errors', async () => {
            // Mock namespace exists but clear fails
            mockIPC.storage.get.mockResolvedValueOnce({ name: 'default' });
            mockIPC.storage.run.mockRejectedValueOnce(new Error('DB Error'));

            await expect(storage.clear()).rejects.toThrow('Failed to clear namespace');
        });

        test('handles listNamespaces operation errors', async () => {
            mockIPC.storage.all.mockRejectedValueOnce(new Error('DB Error'));

            await expect(storage.listNamespaces()).rejects.toThrow('Failed to list namespaces');
        });

        test('handles listKeys operation errors', async () => {
            // Mock namespace exists but listKeys fails
            mockIPC.storage.get.mockResolvedValueOnce({ name: 'default' });
            mockIPC.storage.all.mockRejectedValueOnce(new Error('DB Error'));

            await expect(storage.listKeys()).rejects.toThrow('Failed to list keys');
        });
    });
});
