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
    -   Storage segregation:
        -   Permanent storage for user-saved data (starred items, etc.)
        -   Regular storage for application state and temporary data
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

-   Core implementation in `src/assets/js/shortcuts.js`
-   Shortcuts organized in `src/shortcuts/` directory:
    -   `index.js`: Central registration point for all shortcuts
    -   `navigation.js`: Page navigation shortcuts
    -   `drawer.js`: Drawer control shortcuts
    -   `feeds.js`: Feed-related shortcuts
    -   `star.js`: Star-related shortcuts
-   Built for cross-environment support:
    -   Uses Command (⌘) key in Electron/macOS
    -   Uses Control (Ctrl) key in web browsers
-   Features:
    -   Configurable shortcuts with storage persistence
    -   Cross-window shortcut synchronization in Electron
    -   Conflict prevention with browser/system shortcuts
    -   User-customizable via settings UI
    -   Help documentation in drawer
    -   Modular organization by functionality
    -   Context-aware shortcut activation
-   Default shortcuts:
    -   `⌘/Ctrl + H`: Navigate to Home
    -   `⌘/Ctrl + ,`: Navigate to Settings
    -   `⌘/Ctrl + B`: Toggle Drawer
    -   `⌘/Ctrl + /`: Show Help
    -   `⌘/Ctrl + J`: Next feed item
    -   `⌘/Ctrl + K`: Previous feed item
    -   `⌘/Ctrl + R`: Refresh feeds
    -   `⌘/Ctrl + S`: Toggle star on active feed item
-   Example usage:

    ```javascript
    // Register shortcuts for a specific functionality
    export function registerNavigationShortcuts() {
    	shortcuts.register('navigateHome', () => {
    		window.location.href = './index.html';
    	});
    }

    // Update a shortcut binding
    await shortcuts.update('navigateHome', 'mod+shift+h');

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
            -   Action buttons section for item interactions
        -   Attributes:
            -   `title`: The title of the feed item
            -   `content`: The HTML content of the feed item
            -   `source`: The source/author of the feed item
            -   `published`: ISO date string of publication date
            -   `link`: URL to the original content
            -   `active`: Boolean attribute for active state
            -   `isread`: Boolean attribute indicating if the item has been read
            -   `starred`: Boolean attribute indicating if the item is starred
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
            	isread="true"
            	starred="true"
            >
            </kupukupu-feed-item>
            ```
        -   Visual States:
            -   Unread items: Full opacity, normal text color
            -   Read items: Reduced opacity (0.6), muted text color
            -   Active items: Full opacity regardless of read state, focused border
            -   Error state: Red border with centered error message

    -   Star Button (`<kupukupu-star-button>`):
        -   Provides starring functionality for feed items
        -   Features:
            -   Custom SVG icons for starred/unstarred states
            -   Smooth animations with reduced motion support
            -   Keyboard shortcut support (mod+s)
            -   Theme-aware styling using CSS custom properties
            -   Persistent storage of starred items
            -   Shadow DOM encapsulation for style isolation
        -   Attributes:
            -   `itemId`: The ID of the feed item this button is associated with
            -   `starred`: Boolean attribute indicating if the item is starred
        -   Events:
            ```javascript
            // Events emitted by the star button
            itemStarred; // When an item is starred (includes itemId)
            itemUnstarred; // When an item is unstarred (includes itemId)
            ```

### Feed Management System

-   Located in `src/assets/js/feed-manager.js`
-   Features:
    -   Automatic feed fetching and parsing
    -   Support for both RSS and Atom feeds
    -   Configurable fetch intervals (default: 60 minutes)
    -   Concurrent fetching with rate limiting
    -   Automatic deduplication of feed items
    -   Read state tracking and persistence
    -   Error handling with automatic retries
    -   Background fetching in both web and desktop environments
-   Configuration Constants:
    -   `FETCH_CONCURRENCY`: Maximum concurrent fetches (10)
    -   `DEFAULT_FETCH_INTERVAL`: Time between fetches (60 minutes)
    -   `MAX_RETRIES`: Maximum fetch retry attempts (3)
    -   `ITEMS_PER_FEED`: Maximum items to keep per feed (10)
-   Example usage:

    ```javascript
    // Feed manager is exported as a singleton
    import { feedManager } from './feed-manager.js';

    // Initialize feed manager
    await feedManager.initialize();

    // Manually trigger feed refresh
    await feedManager.fetchAllFeeds();
    ```

-   Events:
    ```javascript
    // Events emitted by feed manager
    newFeedItems; // When new items are available (includes feedId and count)
    feedError; // When a feed fails to fetch (includes feedId and error)
    feedItemRead; // When an item is marked as read (includes id)
    ```

## Pending Tasks

### High Priority

1. Implement text selection system.

    - Selecting some text in a feed item should show a tooltip with icons to add comments, summarize, ask questions etc.
    - When user clicks on an icon, the drawer should open with appropriate controls.
    - Initial icons to show, with appropriate functionality:
        - Comment: Allows the user to add a comment to the feed item, with the selected text being highligted (this must persist when the drawer is closed and across page views and sessions)
        - Summarize: Summarize the selected text. This will be sent to an LLM, and the response will be displayed in the drawer. (LLM Functionality not yet implemented, so this will be disabled for now)
        - Questions: Ask a question about the item. This will be sent to an LLM, and the response will be displayed in the drawer. (LLM Functionality not yet implemented, so this will be disabled for now)
    - Should be accessible and themeable.
    - Should use the JavaScript Selection API to get the selected text. See: https://developer.mozilla.org/en-US/docs/Web/API/Selection

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
