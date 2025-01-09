import Store from 'electron-store';
import isDev from 'electron-is-dev';
import { app } from 'electron';

/**
 * Storage Configuration
 *
 * This configuration ensures settings are isolated between development and production environments.
 *
 * Storage Locations:
 * 1. Browser Environment:
 *    - Uses localStorage in the browser
 *    - Data is stored in the browser's storage area for the domain
 *
 * 2. Electron Development:
 *    - macOS:   ~/Library/Application Support/KupuKupuDev/kupukupu-dev-store.json
 *    - Windows: %APPDATA%/KupuKupuDev/kupukupu-dev-store.json
 *    - Linux:   ~/.config/KupuKupuDev/kupukupu-dev-store.json
 *
 * 3. Electron Production:
 *    - macOS:   ~/Library/Application Support/KupuKupu/kupukupu-store.json
 *    - Windows: %APPDATA%/KupuKupu/kupukupu-store.json
 *    - Linux:   ~/.config/KupuKupu/kupukupu-store.json
 *
 */

// Configure the store with environment-specific settings
const store = new Store({
    // Use different store names for dev and prod
    name: isDev ? 'kupukupu-dev-store' : 'kupukupu-store',

    // Set the project name for the config directory
    projectName: isDev ? 'KupuKupuDev' : 'KupuKupu',

    // Ensure we're using the correct user data path
    cwd: isDev ? app.getPath('userData') + '-dev' : app.getPath('userData'),

    clearInvalidConfig: true,
    defaults: {}
});

// Log the store path in development for debugging
if (isDev) {
    console.log('Store path:', store.path);
}

export const storeHandlers = {
    'store:get': (event, key) => {
        return store.get(key);
    },

    'store:set': (event, { key, value }) => {
        store.set(key, value);
        return true;
    },

    'store:delete': (event, key) => {
        store.delete(key);
        return true;
    },

    'store:clear': () => {
        store.clear();
        return true;
    },

    'store:has': (event, key) => {
        return store.has(key);
    }
};