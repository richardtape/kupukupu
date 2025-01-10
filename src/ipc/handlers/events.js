import { BrowserWindow } from 'electron';

/**
 * Event System IPC Handlers
 *
 * These handlers manage event communication between the main and renderer processes
 * in the Electron environment. They enable cross-window event propagation by:
 *
 * 1. Receiving events from any renderer process
 * 2. Broadcasting those events to all open windows
 * 3. Preserving event metadata (IDs, data) during transmission
 *
 * The event system supports:
 * - Cross-window communication
 * - Event deduplication (via sourceEventId)
 * - Automatic window cleanup (destroyed windows are skipped)
 */
export const eventHandlers = {
    /**
     * Handles event publishing from renderer processes.
     * Broadcasts the event to all open windows, including the sender.
     *
     * @param {Electron.IpcMainInvokeEvent} event - The IPC event object
     * @param {Object} packet - The event packet to broadcast
     * @param {string} packet.eventName - The name of the event
     * @param {*} packet.data - The event payload
     * @param {number} packet.sourceEventId - Unique ID to prevent duplicate handling
     * @returns {boolean} Always returns true to indicate successful broadcast
     */
    'events:publish': (event, packet) => {
        // Get all windows
        const windows = BrowserWindow.getAllWindows();

        // Broadcast the event to all renderer processes
        windows.forEach(window => {
            if (!window.isDestroyed()) {
                window.webContents.send('events:receive', packet);
            }
        });

        return true;
    }
};