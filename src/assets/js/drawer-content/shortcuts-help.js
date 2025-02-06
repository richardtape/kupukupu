import { shortcuts } from '../shortcuts.js';
import { isElectron } from '../../../utils/index.js';

/**
 * Get the correct base path for navigation based on environment
 * @returns {string} The base path to use for navigation
 */
function getBasePath() {
    return isElectron() ? '/' : '/pages/';
}

/**
 * Renders the shortcuts help content for the drawer
 * @returns {string} HTML content for the drawer
 */
export function renderShortcutsHelp() {
    const currentShortcuts = shortcuts.getAll();

    // Format shortcuts for display
    const formattedShortcuts = Object.entries(currentShortcuts).map(([action, shortcut]) => {
        const label = {
            navigateHome: 'Navigate to Home',
            navigateSettings: 'Navigate to Settings',
            toggleDrawer: 'Toggle Drawer',
            showHelp: 'Show Help'
        }[action];

        const formattedShortcut = shortcut
            .replace('mod', shortcuts.isElectron ? '⌘' : 'Ctrl')
            .replace('shift', '⇧')
            .replace('alt', '⌥')
            .replace('+', ' + ')
            .toUpperCase();

        return `
            <div class="shortcut-help-item">
                <span class="shortcut-help-label">${label}</span>
                <kbd class="shortcut-help-key">${formattedShortcut}</kbd>
            </div>
        `;
    }).join('');

    return `
        <div class="shortcuts-help">
            <h2>Keyboard Shortcuts</h2>
            <p>Use these keyboard shortcuts to quickly navigate and control KupuKupu:</p>
            <div class="shortcuts-help-list">
                ${formattedShortcuts}
            </div>
            <p class="shortcuts-help-note">
                You can customize these shortcuts in the <a href="./settings.html">Settings</a> page.
            </p>
        </div>
    `;
}