import { isElectronEnvironment, getRuntimeEnvironment } from '../../src/js/utils/environment.js';

describe('Environment Detection', () => {
    beforeEach(() => {
        // Reset window.electronAPI before each test
        window.electronAPI = undefined;
    });

    describe('isElectronEnvironment', () => {
        test('returns false when electronAPI is not present', () => {
            expect(isElectronEnvironment()).toBe(false);
        });

        test('returns false when electronAPI is present but isElectron is false', () => {
            window.electronAPI = { isElectron: false };
            expect(isElectronEnvironment()).toBe(false);
        });

        test('returns true when electronAPI is present and isElectron is true', () => {
            window.electronAPI = { isElectron: true };
            expect(isElectronEnvironment()).toBe(true);
        });
    });

    describe('getRuntimeEnvironment', () => {
        test('returns "browser" when not in electron environment', () => {
            window.electronAPI = { isElectron: false };
            expect(getRuntimeEnvironment()).toBe('browser');
        });

        test('returns "electron" when in electron environment', () => {
            window.electronAPI = { isElectron: true };
            expect(getRuntimeEnvironment()).toBe('electron');
        });
    });
});