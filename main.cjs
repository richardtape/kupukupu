const { app, BrowserWindow } = require('electron');
const path = require('path');

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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
