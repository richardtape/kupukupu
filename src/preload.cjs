const { contextBridge, ipcRenderer } = require('electron');

console.log('Initializing preload script');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api',
    {
        environment: {
            isElectron: true
        },
        store: {
            get: (key) => ipcRenderer.invoke('store:get', key),
            set: (key, value) => ipcRenderer.invoke('store:set', { key, value }),
            delete: (key) => ipcRenderer.invoke('store:delete', key),
            clear: () => ipcRenderer.invoke('store:clear'),
            has: (key) => ipcRenderer.invoke('store:has', key)
        },
        send: (channel, data) => {
            // Whitelist channels
            const validChannels = ['toMain'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel, func) => {
            const validChannels = ['fromMain'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);