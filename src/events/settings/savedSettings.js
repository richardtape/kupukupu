import { pubsub } from '../../assets/js/pubsub.js';
import { notify } from '../../assets/js/notifications.js';

/**
 * Handler for the savedSettings event
 * Triggered when settings are successfully saved
 */
pubsub.on('savedSettings', (settings) => {
    notify.success('Settings saved successfully');
});