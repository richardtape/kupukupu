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
-   Uses IndexedDB in web browser environment
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

-   Features:
    -   Asynchronous operations with Promise-based API
    -   Automatic database initialization and error handling
    -   Large storage capacity in browser (compared to localStorage)
    -   Efficient storage of complex objects and binary data
    -   Consistent error handling across environments
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
    -   `j`: Next feed item
    -   `k`: Previous feed item
    -   `r`: Refresh feeds
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

    -   Feed Item (`<kupukupu-feed-item>`):
        -   Displays individual feed items in a consistent format
        -   Features:
            -   Responsive layout for various screen sizes
            -   Keyboard navigation support (mod+j/mod+k)
            -   Automatic read state management
            -   Focus management for keyboard navigation
            -   Visual state management (opacity transitions)
            -   Error state handling with user feedback
            -   Smooth scrolling when items become active
            -   Theme-aware styling using CSS custom properties
            -   Reduced motion support
            -   Shadow DOM encapsulation for style isolation
        -   Attributes:
            -   `title`: The title of the feed item
            -   `content`: The HTML content of the feed item
            -   `source`: The source/author of the feed item
            -   `published`: ISO date string of publication date
            -   `link`: URL to the original content
            -   `active`: Boolean attribute for active state
        -   Events:
            ```javascript
            // Events emitted by the feed item
            feedItemSelected; // When item becomes active (includes id)
            feedItemRead; // When item is marked as read (includes id)
            ```
        -   Example usage:
            ```html
            <kupukupu-feed-item
            	id="item-1"
            	title="Article Title"
            	content="<p>Article content...</p>"
            	source="Blog Name"
            	published="2024-03-21T12:00:00Z"
            	link="https://example.com/article"
            	active="true"
            >
            </kupukupu-feed-item>
            ```

## Pending Tasks

### High Priority

1. Add RSS Fetching
2. Implement Service Worker
    - Enable offline access to feeds and content
    - Cache feed content and images
    - Handle background sync for feed updates

### Low Priority

1. Development Tools

    - Add development utilities
    - Implement debugging helpers

2. Keyboard Shortcuts Enhancements

    - Add shortcuts for upcoming features (Today, Profile)
    - Add visual feedback when shortcuts are triggered
    - Consider adding a search feature to help documentation
    - Add support for custom shortcuts beyond predefined actions
    - Add ability to open feed items in external browser
    - Add shortcuts for marking items as read/unread/starred/unstarred

3. Add a tooltip system

    - Implement as a question mark icon that when hovered (or tapped on mobile) displays a tooltip
    - Tooltips should be modal and not interfere with the main content
    - Must be accessible
    - Must be themeable

4. Feed Management Enhancements
    - Add customizable feed fetch frequency
    - Implement content filtering and search functionality
    - Add bookmarking/starring of feed items
    - Add "Mark all as read" functionality
    - Add expanded storage quota for desktop environment
    - Add ability to mark posts as unread manually
    - Implement feed URL discovery from website URLs
    - Add feed validation before adding new feeds

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
