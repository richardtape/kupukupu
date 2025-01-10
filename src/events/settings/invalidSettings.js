import { pubsub } from '../../assets/js/pubsub.js';

/**
 * Handler for the invalidSettings event
 * Triggered when settings validation fails
 */
pubsub.on('invalidSettings', (errors) => {
    console.log('Settings validation failed:', errors);
});