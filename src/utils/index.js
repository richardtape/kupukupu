/**
 * KupuKupu Utilities
 *
 * This file re-exports all utility functions for easy importing.
 * Import utilities from this file rather than their individual files:
 *
 * @example
 * // Good
 * import { isElectron } from '../utils';
 *
 * // Avoid
 * import { isElectron } from '../utils/environment';
 */

export { isElectron } from './environment.js';
export { createHash } from './hash.js';