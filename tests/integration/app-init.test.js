import { init } from '../../src/js/app.js';

describe('App Initialization', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        // Spy on console.log and error
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        // Reset window.electronAPI before each test
        window.electronAPI = undefined;
    });

    afterEach(() => {
        // Clean up spies
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    test('logs correct environment on initialization in browser', async () => {
        await init();
        // Wait for any pending promises
        await new Promise(process.nextTick);
        expect(consoleLogSpy).toHaveBeenCalledWith('Running in browser mode');
    }, 10000); // Increase timeout to 10 seconds

    test('logs correct environment on initialization in electron', async () => {
        window.electronAPI = { isElectron: true };
        await init();
        // Wait for any pending promises
        await new Promise(process.nextTick);
        expect(consoleLogSpy).toHaveBeenCalledWith('Running in electron mode');
    }, 10000); // Increase timeout to 10 seconds
});
