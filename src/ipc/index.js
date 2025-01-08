import { ipcMain } from 'electron';
import { storeHandlers } from './handlers/store.js';

// Register all handlers
export function setupIpcHandlers() {
    // Register store handlers
    Object.entries(storeHandlers).forEach(([channel, handler]) => {
        ipcMain.handle(channel, handler);
    });

    // Basic message handler
    ipcMain.on('toMain', (event, data) => {
        console.log('Received in main:', data);
        // You can send a response back using:
        // event.reply('fromMain', responseData);
    });

    // Add more handler registrations here as needed
}