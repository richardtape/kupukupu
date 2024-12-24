/**
 * Kupukupu - A modern RSS reader
 * Copyright (C) 2024 Rich Tape
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

let db;

/**
 * Creates the main application window.
 *
 * This function creates a new BrowserWindow, sets it up to load the app UI,
 * and then loads the UI.
 *
 * If running in development mode, the window is told to load the app from
 * the Vite development server.  Otherwise, it's told to load the app from
 * the "dist" directory.
 *
 * In development, the window's dev tools are also opened.
 *
 * @private
 */
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
        },
    });

    // In development, load from Vite dev server
    if (process.env.NODE_ENV === 'development') {
        // Vite dev server URL
        win.loadURL(`http://localhost:${process.env.PORT || 3001}`);
        win.webContents.openDevTools();
    } else {
        // In production, load from built files
        win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
}

// Set the NODE_ENV if it's not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';


/**
 * Initializes the SQLite database for storing application data.
 *
 * This function sets up the database by determining its path within the
 * user's data directory, creating a new database instance, and enabling
 * Write-Ahead Logging (WAL) mode for better concurrent access. The database
 * is set to verbose mode if running in a development environment.
 *
 * @private
 */
function initializeDatabase() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'storage.db');

    db = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : null
    });

    // Enable WAL mode for better concurrent access
    db.pragma('journal_mode = WAL');
}

// Handle IPC calls
ipcMain.handle('storage:run', async (_, query, params) => {
    try {
        const stmt = db.prepare(query);
        return stmt.run(params || []); // Use empty array if params is null
    } catch (error) {
        console.error('Error in storage:run:', error);
        throw error;
    }
});

ipcMain.handle('storage:get', async (_, query, params) => {
    try {
        const stmt = db.prepare(query);
        return stmt.get(params || []); // Use empty array if params is null
    } catch (error) {
        console.error('Error in storage:get:', error);
        throw error;
    }
});

ipcMain.handle('storage:all', async (_, query, params) => {
    try {
        const stmt = db.prepare(query);
        return stmt.all(params || []); // Use empty array if params is null
    } catch (error) {
        console.error('Error in storage:all:', error);
        throw error;
    }
});

ipcMain.handle('storage:getSize', async () => {
    try {
        const stats = db.pragma('page_size, page_count');
        const size = stats[0].page_size * stats[0].page_count;
        return { size };
    } catch (error) {
        console.error('Error getting database size:', error);
        throw error;
    }
});

app.whenReady().then(() => {
    initializeDatabase();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Clean up database connection
app.on('before-quit', () => {
    if (db) {
        db.close();
    }
});