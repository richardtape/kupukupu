import { getRuntimeEnvironment } from './utils/environment.js';

/**
 * Initializes the application and logs the current runtime environment.
 *
 * @example
 * init(); // Logs "Running in browser mode" or "Running in electron mode"
 */
export function init() {
    console.log(`Running in ${getRuntimeEnvironment()} mode`);
    // Add app initialization code here
}

// Only initialize if we're in a browser environment
if (typeof window !== 'undefined' && typeof jest === 'undefined') {
    init();
}
