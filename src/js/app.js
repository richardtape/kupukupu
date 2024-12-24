import { getRuntimeEnvironment } from './utils/environment.js';
import SettingsManager from './core/settings/SettingsManager.js';

// Create a single instance of SettingsManager
const settingsManager = new SettingsManager();

/**
 * Loads the current theme from settings.
 */
export async function loadCurrentTheme() {
    const theme = await settingsManager.getTheme();
    if (theme) {
        const themeLink = document.querySelector('link[href*="/themes/"]') || document.createElement('link');
        themeLink.rel = 'stylesheet';
        themeLink.href = `/src/css/themes/${theme}.css`;

        if (!document.querySelector(`link[href="${themeLink.href}"]`)) {
            document.head.appendChild(themeLink);
        }
    }
}

/**
 * Initializes the application and logs the current runtime environment.
 *
 * @example
 * init(); // Logs "Running in browser mode" or "Running in electron mode"
 */
export async function init() {
    console.log(`Running in ${getRuntimeEnvironment()} mode`);

    try {
        await settingsManager.initialize();
        await loadCurrentTheme();
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// Only initialize if we're in a browser environment
if (typeof window !== 'undefined' && typeof jest === 'undefined') {
    init();
}
