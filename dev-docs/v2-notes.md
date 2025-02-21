-   Need a layout which allows to have sidebar, plus another 'intermediary' sidebar which would list all the feed controls/filters. This intermediary could be placed either between the navigation sidebare and the main feed content, at the top of the app, or at the bottom of the app (perhaps as a drawer). Wherever this intermediary is placed it should be closable.

-   Storage: In the Electron environment, it uses electron-store via IPC calls for persistent storage. In the browser environment, it uses IndexedDB for persistent storage.

-   Storage of feeds needs to be handled carefully. Storing them with integers (i.e. feed_1_posts) leads to a problem, so ensure the feed is stored with a hash of the url as part of the key name (i.e. feed_d5h2hd_posts where d5h2hd is the hash of the feed url). This makes associating feed items with a feed url easier, and also allows for feeds to be added and removed more easily.

-   Fetching of feeds needs to be done in the background. Pages that display feed items (home page, 'today' page etc.) should show items already stored in storage, and then newer items should be merged into the items being shown.

-   Summarizing of feed items (sent to an LLM) needs to be done in the background. This should only be done for starred feeds.
