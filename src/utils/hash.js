/**
 * Creates a hash from a string using a simple but fast algorithm
 * This is used to generate unique identifiers for feed items
 *
 * @param {string} str - The string to hash
 * @returns {string} A hash of the input string
 */
export function createHash(str) {
    let hash = 0;
    if (!str) return hash.toString(36);

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
}