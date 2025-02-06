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

### Shortcuts System

-   Located in `src/assets/js/shortcuts.js`
-   Built for cross-environment support:
    -   Uses Command (⌘) key in Electron/macOS
    -   Uses Control (Ctrl) key in web browsers
-   Features:
    -   Configurable shortcuts with storage persistence
    -   Cross-window shortcut synchronization in Electron
    -   Conflict prevention with browser/system shortcuts
    -   User-customizable via settings UI
    -   Help documentation in drawer
-   Default shortcuts:
    -   `⌘/Ctrl + H`: Navigate to Home
    -   `⌘/Ctrl + ,`: Navigate to Settings
    -   `⌘/Ctrl + B`: Toggle Drawer
    -   `⌘/Ctrl + /`: Show Help
-   Example usage:

    ```javascript
    import { shortcuts } from './shortcuts.js';

    // Register a shortcut handler
    shortcuts.register('customAction', () => {
    	console.log('Custom shortcut triggered');
    });

    // Update a shortcut binding
    await shortcuts.update('customAction', 'mod+k');

    // Reset all shortcuts to defaults
    await shortcuts.resetToDefaults();
    ```

-   Component styles:
    -   Shortcut input component: `src/assets/css/base/components/shortcuts.css`
    -   Help display: `src/assets/css/base/components/shortcuts-help.css`
    -   Uses CSS variables for theming
    -   Follows component pattern for modularity

### Notifications System

-   Located in `src/assets/js/notifications.js`
-   Built on top of `notyf` for efficient toast notifications
-   Cross-environment support:
    -   Browser: Standard notifications
    -   Electron: Cross-window notification propagation via PubSub
-   Features:
    -   Success, error, and warning notification types
    -   Customizable duration and dismissible options
    -   Reduced motion support
    -   Theme-aware styling using CSS variables
    -   Deduplication in Electron windows
-   Example usage:

    ```javascript
    import { notify } from './notifications.js';

    // Simple usage
    notify.success('Settings saved successfully');
    notify.error('Failed to save settings');
    notify.warning('You have unsaved changes');

    // Advanced usage
    notify.show({
    	message: 'Custom notification',
    	type: 'warning',
    	duration: 0, // Won't auto-dismiss
    	dismissible: true,
    });
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

### Web Components

-   Located in `src/components/`
-   Each component in its own directory with consistent structure:
    -   Component logic: `{component-name}/{component-name}.js`
    -   HTML template: `{component-name}/{component-name}.template.html`
    -   Component styles: `{component-name}/{component-name}.css`
-   Currently implemented components:

    -   Navigation (`<kupukupu-navigation>`):

        -   Provides main application navigation sidebar
        -   Theme-aware styling using CSS custom properties
        -   Accessible keyboard navigation and ARIA attributes
        -   Automatic active state management
        -   Example usage:

            ```html
            <kupukupu-navigation></kupukupu-navigation>
            ```

    -   Drawer (`<kupukupu-drawer>`):

        -   Provides sliding drawer functionality
        -   Uses pubsub for open/close events
        -   Theme-aware styling using CSS custom properties
        -   Full accessibility support with ARIA attributes
        -   Focus management and keyboard navigation
        -   Reduced motion support
        -   Example usage:

            ```html
            <kupukupu-drawer>
            	<h2>Drawer Content</h2>
            	<p>Content to show in the drawer...</p>
            </kupukupu-drawer>

            <!-- Trigger button -->
            <button id="open-drawer">Open Drawer</button>
            ```

        -   Events:

            ```javascript
            // Events emitted by the drawer
            drawerWillOpen; // Before opening
            drawerDidOpen; // After opening
            drawerWillClose; // Before closing
            drawerDidClose; // After closing
            drawerStateChange; // When state changes (with isOpen boolean)

            // Event to open drawer
            pubsub.emit('openDrawer');
            ```

## Pending Tasks

### High Priority

1. Add a tooltip system.
    - Implement as a question mark icon that when hovered (or tapped on mobile) displays a tooltip.
    - Tooltips should be modal and not interfere with the main content.
    - Must be accessible.
    - Must be themeable.

### Low Priority

1. Development Tools

    - Add development utilities
    - Implement debugging helpers

2. Keyboard Shortcuts Enhancements
    - Add shortcuts for upcoming features (Today, Profile)
    - Add visual feedback when shortcuts are triggered
    - Consider adding a search feature to help documentation
    - Add support for custom shortcuts beyond predefined actions

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

## Known Issues

None.
