/**
 * Determines if the application is running in Electron or browser environment.
 *
 * This function checks for the presence of the electronAPI object which is
 * exposed by our Electron preload script. The electronAPI object contains
 * an isElectron property that explicitly indicates we're in Electron.
 *
 * @returns {boolean} True if running in Electron, false if running in browser
 *
 * @example
 * if (isElectronEnvironment()) {
 *   // Use Electron-specific features
 * } else {
 *   // Use browser-specific features
 * }
 */
export function isElectronEnvironment() {
    return window.electronAPI?.isElectron ?? false;
}

/**
 * Returns a string representing the current runtime environment.
 *
 * @returns {'electron'|'browser'} The current environment
 *
 * @example
 * console.log(`Running in ${getRuntimeEnvironment()} mode`);
 */
export function getRuntimeEnvironment() {
    return isElectronEnvironment() ? 'electron' : 'browser';
}