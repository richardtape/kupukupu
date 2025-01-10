import { pubsub } from '../../assets/js/pubsub.js';

/**
 * Handler for the beforeSaveSettings event
 * Triggered when settings are about to be saved
 */
pubsub.on('beforeSaveSettings', (settings) => {
    console.log('About to save settings:', settings);
});