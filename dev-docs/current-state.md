# Current State of KupuKupu

## Application Overview

KupuKupu is being developed as both a web application and an Electron desktop application, using vanilla JavaScript, HTML, and CSS. The application is designed to run in multiple environments while maintaining consistent functionality. No Typescript will be used. No frameworks such as React, Vue, Angular, etc. will be used.

## Environment Support

### Web Browser

-   Served via Vite development server in development
-   Can be deployed to any web server in production
-   Entry point: `src/pages/index.html`

### Electron Desktop

-   Runs as a native desktop application
-   Uses IPC (Inter-Process Communication) for secure main process operations
-   Entry points:
    -   Main Process: `src/electron.js`
    -   Preload Script: `src/preload.cjs`
    -   Renderer Process: `src/pages/index.html`

## Current Architecture

### IPC System

-   Located in `src/ipc/`
-   Modular handler system for different functionalities
-   Currently implemented handlers:
    -   Storage (`src/ipc/handlers/store.js`)
    -   Events (`src/ipc/handlers/events.js`)

### Storage System

-   Uses `electron-store` in Electron environment
-   Uses `localStorage` in web browser environment
-   Provides a consistent API across all environments:

    ```javascript
    // Get an instance of the storage interface
    const storage = new Storage();

    // Available methods
    storage.get(key);
    storage.set(key, value);
    storage.delete(key);
    storage.clear();
    storage.has(key);
    ```

-   Comprehensive documentation available in JSDoc format
-   Environment detection working correctly via preload script

### Event System

-   Located in `src/assets/js/pubsub.js`
-   Built on top of `mitt` for efficient event handling
-   Cross-environment support:
    -   Browser: In-memory event handling
    -   Electron: Cross-window event propagation via IPC
-   Features:
    -   Event deduplication in Electron
    -   Automatic cleanup of processed events
    -   Consistent async/sync behavior
-   Example usage:

    ```javascript
    import { pubsub } from './pubsub.js';

    // Subscribe to events
    pubsub.on('settingsChanged', (data) => {
    	console.log('Settings changed:', data);
    });

    // Publish events
    await pubsub.emit('settingsChanged', { theme: 'dark' });
    ```

### Utility System

-   Located in `src/utils/`
-   Modular structure with individual utility files
-   Central index for clean imports
-   Currently implemented utilities:
    -   Environment detection (`environment.js`)
        -   `isElectron()`: Checks for Electron runtime
        -   `getEnvironment()`: Returns current environment name
-   Usage:

    ```javascript
    import { isElectron } from '../utils';

    if (isElectron()) {
    	// Electron-specific code
    }
    ```

## Pending Tasks

### High Priority

1. Add Notifications system
    - Design and implement notifications that leverage the PubSub system
    - Support different notification types (success, error, warning)
    - Ensure cross-environment compatibility

### Low Priority

1. Documentation

    - Development setup guide
    - Deployment procedures
    - Component documentation

2. Development Tools
    - Add development utilities
    - Implement debugging helpers

## Build Processes

### Development

-   `npm run dev`: Starts the Vite development server for web development
-   `npm run electron:dev`: Runs both the Vite dev server and Electron app concurrently
-   `npm run preview`: Previews the built web application
-   `npm run electron:preview`: Previews the built Electron application

### Production

-   `npm run build`: Builds the web application using Vite
-   `npm run electron:build`: Builds both the web application and packages the Electron app

## Build Configuration

-   Uses Vite for web bundling
-   Uses electron-builder for desktop packaging
-   Supports both macOS and Windows builds
-   ASAR packaging enabled for production builds

## Next Steps

1. Design and implement PubSub system

    - Create event bus architecture
    - Implement environment-specific adapters
    - Add documentation and examples

2. Implement Notifications system

    - Design notification component
    - Create notification manager
    - Add user preferences for notifications
    - Implement cross-environment support

3. Add comprehensive testing suite
4. Enhance documentation

## Known Issues

None.

## Recent Improvements

-   Implemented browser storage compatibility layer using localStorage
-   Fixed environment detection issue in main.js
-   Added comprehensive JSDoc documentation for storage system
-   Created unified storage interface for cross-environment compatibility
-   Implemented basic settings page with theme support and RSS feed management. Very few settings actually do anything yet.
