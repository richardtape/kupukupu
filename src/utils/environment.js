/**
 * Environment detection utilities for KupuKupu.
 *
 * These utilities help determine the runtime environment (Electron vs Browser)
 * and provide consistent environment checks across the application.
 */

/**
 * Checks if the application is running in an Electron environment.
 *
 * This check looks for the Electron bridge API which is exposed through
 * the contextBridge in our preload script.
 *
 * @returns {boolean} True if running in Electron, false if in browser
 *
 * @example
 * if (isElectron()) {
 *     // Use Electron-specific features
 * } else {
 *     // Use browser-specific features
 * }
 */
export function isElectron() {
    return window?.api?.environment?.isElectron === true;
}

/**
 * Gets the current environment name.
 *
 * Useful for logging, analytics, or environment-specific behavior.
 *
 * @returns {'electron'|'browser'} The current environment name
 *
 * @example
 * console.log(`Running in ${getEnvironment()} environment`);
 */
export function getEnvironment() {
    return isElectron() ? 'electron' : 'browser';
}