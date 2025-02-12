import { ipcMain } from 'electron';
import fetch from 'node-fetch';

/**
 * Register feed-related IPC handlers
 */
export function registerFeedHandlers() {
    // Handler for fetching feed content
    ipcMain.handle('fetchFeed', async (event, url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            return { ok: true, data: text };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    });

    // Handler for validating feed URLs
    ipcMain.handle('validateFeed', async (event, url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            return { ok: true, data: text };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    });
}