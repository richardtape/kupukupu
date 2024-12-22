import { init } from '../../src/js/app.js';

describe('App Initialization', () => {
    let consoleLogSpy;

    beforeEach(() => {
        // Spy on console.log
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        // Reset window.electronAPI before each test
        window.electronAPI = undefined;
    });

    afterEach(() => {
        // Clean up spy
        consoleLogSpy.mockRestore();
    });

    test('logs correct environment on initialization in browser', () => {
        init();
        expect(consoleLogSpy).toHaveBeenCalledWith('Running in browser mode');
    });

    test('logs correct environment on initialization in electron', () => {
        window.electronAPI = { isElectron: true };
        init();
        expect(consoleLogSpy).toHaveBeenCalledWith('Running in electron mode');
    });
});