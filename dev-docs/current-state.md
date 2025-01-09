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

### Storage System

-   Uses `electron-store` in Electron environment
-   Provides a consistent API through IPC:
    ```javascript
    window.api.store.get(key);
    window.api.store.set(key, value);
    window.api.store.delete(key);
    window.api.store.clear();
    window.api.store.has(key);
    ```

## Pending Tasks

### High Priority

1. Create browser compatibility layer for storage

    - Implement localStorage-based solution for web environment
    - Ensure consistent API across platforms

2. Add PubSub system
    - Design and implement IPC handlers for pub/sub
    - Ensure cross-environment compatibility

### Low Priority

1. Documentation

    - API documentation for storage system
    - Development setup guide
    - Deployment procedures

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

1. Implement browser compatibility layer for storage
2. Design and implement PubSub system
3. Add comprehensive testing suite
4. Enhance documentation

## Known Issues

-   Regardless of the environment, in the developer tools console, it always says "Running in Browser environment". i.e. it appears the isElectron check is not working in main.js
