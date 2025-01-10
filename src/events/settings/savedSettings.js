import { pubsub } from '../../assets/js/pubsub.js';

/**
 * Handler for the savedSettings event
 * Triggered when settings are successfully saved
 */
pubsub.on('savedSettings', (settings) => {
    console.log('Settings saved successfully:', settings);
});