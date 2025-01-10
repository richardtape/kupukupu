import { pubsub } from '../../assets/js/pubsub.js';

/**
 * Handler for the savedSettingsFailed event
 * Triggered when settings fail to save
 */
pubsub.on('savedSettingsFailed', (error) => {
    console.log('Failed to save settings:', error);
});