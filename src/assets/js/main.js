// Check if we're running in Electron
const isElectron = window?.process?.type === 'renderer';

// Log environment information
console.log(`Running in ${isElectron ? 'Electron' : 'Browser'} environment`);

// Basic initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initialized');
});