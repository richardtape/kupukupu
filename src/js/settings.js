import { getRuntimeEnvironment } from './utils/environment.js';
import SettingsManager from './core/settings/SettingsManager.js';

// Create a single instance of SettingsManager
const settingsManager = new SettingsManager();

/**
 * Updates the feed list display.
 *
 * @param {import('./core/settings/SettingsManager.js').FeedEntry[]} feeds - Array of feed entries
 * @example
 * const feeds = await settingsManager.getFeeds();
 * updateFeedList(feeds);
 */
function updateFeedList(feeds) {
    const feedList = document.getElementById('feed-list');
    feedList.innerHTML = '';

    feeds.forEach(feed => {
        const entry = document.createElement('div');
        entry.className = 'feed-entry';

        entry.innerHTML = `
            <div>
                <strong>${feed.title}</strong>
                <div>${feed.url}</div>
                <div><small>Added: ${new Date(feed.added).toLocaleString()}</small></div>
            </div>
            <button data-feed-id="${feed.id}">Remove</button>
        `;

        const removeButton = entry.querySelector('button');
        removeButton.addEventListener('click', async () => {
            try {
                await settingsManager.removeFeed(feed.id);
                const updatedFeeds = await settingsManager.getFeeds();
                updateFeedList(updatedFeeds);
            } catch (error) {
                alert(error.message);
            }
        });

        feedList.appendChild(entry);
    });
}

/**
 * Loads a theme's CSS.
 *
 * @param {string} theme - The theme name to load
 * @example
 * // Load the fern theme and apply it
 * const currentTheme = await settingsManager.getTheme();
 * if (currentTheme) {
 *     await loadTheme(currentTheme);
 * }
 */
async function loadTheme(theme) {
    const themeLink = document.querySelector('link[href*="/themes/"]') || document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = `/src/css/themes/${theme}.css`;

    if (!document.querySelector(`link[href="${themeLink.href}"]`)) {
        document.head.appendChild(themeLink);
    }
}

/**
 * Initializes the settings page.
 */
async function initSettings() {
    console.log(`Running settings in ${getRuntimeEnvironment()} mode`);

    try {
        await settingsManager.initialize();

        const themeInputs = document.querySelectorAll('input[name="theme"]');
        const addFeedForm = document.getElementById('add-feed-form');

        // Load and set current theme
        const currentTheme = await settingsManager.getTheme();
        if (currentTheme) {
            document.querySelector(`input[value="${currentTheme}"]`).checked = true;
            await loadTheme(currentTheme);
        }

        // Load existing feeds
        const feeds = await settingsManager.getFeeds();
        updateFeedList(feeds);

        // Handle theme changes
        themeInputs.forEach(input => {
            input.addEventListener('change', async (event) => {
                const newTheme = event.target.value;
                await settingsManager.setTheme(newTheme);
                await loadTheme(newTheme);
            });
        });

        // Handle feed submission
        addFeedForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const urlInput = document.getElementById('feed-url');
            const titleInput = document.getElementById('feed-title');

            try {
                await settingsManager.addFeed(urlInput.value, titleInput.value);
                const feeds = await settingsManager.getFeeds();
                updateFeedList(feeds);
                addFeedForm.reset();
            } catch (error) {
                alert(error.message);
            }
        });

    } catch (error) {
        console.error('Failed to initialize settings:', error);
        alert('Failed to initialize settings. Please try refreshing the page.');
    }
}

// Only initialize if we're in a browser environment
if (typeof window !== 'undefined' && typeof jest === 'undefined') {
    initSettings();
}
