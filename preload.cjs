const { contextBridge } = require('electron');

// Expose any Electron-specific APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true
});