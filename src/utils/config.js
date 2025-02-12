/**
 * Get the KupuKupu server URL based on environment
 * @returns {string} The server URL
 */
export function getServerUrl() {
    // For development, use the local URL from .env
    if (import.meta.env.DEV) {
        return import.meta.env.KUPUKUPU_SERVER_LOCAL_URL || 'http://localhost:9797';
    }

    // For production/staging, we'll need to add the proper URLs later
    // For now, default to the local URL as a fallback
    return import.meta.env.KUPUKUPU_SERVER_URL || import.meta.env.KUPUKUPU_SERVER_LOCAL_URL || 'http://localhost:9797';
}