/**
 * Drawer initialization
 * Sets up event listeners for the drawer open button to work with the drawer web component
 */

import { pubsub } from './pubsub.js';

document.addEventListener('DOMContentLoaded', () => {
    const openButton = document.getElementById('open-drawer');
    if (openButton) {
        openButton.addEventListener('click', () => {
            pubsub.emit('openDrawer');
        });
    }
});