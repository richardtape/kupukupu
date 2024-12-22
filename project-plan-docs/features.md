# Kupukupu - RSS Reader Feature Specification

## Core Features

### Feed Management

-   [ ] Add website URL and auto-detect RSS Feed URL
-   [ ] Feed health monitoring (alerts for inactive/dead feeds)
-   [ ] Feed cleanup wizard (identify duplicate feeds, inactive feeds)
-   [ ] Export/Import OPML
-   [ ] Import subscriptions from popular readers (Feedly, Inoreader, etc.)

### Content Organization

-   [ ] Group feeds into folders
-   [ ] Allow feeds to belong to multiple folders
-   [ ] Tag system complementing the folder structure
-   [ ] Batch operations (mark multiple as read, move to folder, etc.)
-   [ ] "Read Later" queue with priority settings
-   [ ] Bookmarks (user-specific saved items)
-   [ ] Archive functionality (separate from bookmarks)

### Reading Experience

-   [ ] Mark as read option (automatic when article viewed)
-   [ ] Strong typography with options
-   [ ] Optimized character count per line for readability
-   [ ] Adjustable font sizes
-   [ ] Text-to-speech integration (basic)
-   [ ] Full accessibility support for screen readers
-   [ ] Progress bar for long articles
-   [ ] Reading position sync across devices (local storage/export)
-   [ ] Offline mode with downloadable unread items
-   [ ] Highlight and take notes on articles (stored locally)

### Interface & Navigation

-   [ ] Light Mode/Dark Mode (customizable color schemes)
-   [ ] Keyboard shortcuts for navigation and actions
-   [ ] Preferred sources prioritization in ordering
-   [ ] Allow adjustment of order (date, bookmarks)
-   [ ] "Today" Panel / "This Week" Panel home screen option
-   [ ] Comments on articles (kept locally)

### Academic Tools

-   [ ] Citation management
-   [ ] Bibliography generator from tagged collections
-   [ ] Ability to create multiple bibliographies based on tags/collections

### Analytics

-   [ ] Stats tracking:
    -   [ ] Number of articles read per site
    -   [ ] Time spent in app
    -   [ ] Number of words read

### Chat Integration

-   [ ] Inline chat with articles via:
    -   [ ] Local LLM (ollama)
    -   [ ] Option to add 3rd Party Service API Keys (Claude, ChatGPT)

## Premium Features

### Enhanced Content Features

-   [ ] Advanced text-to-speech with premium models
-   [ ] Website content extraction for sites without RSS
-   [ ] Notifications for new content:
    -   [ ] In-app notifications
    -   [ ] Email notifications (if signed in)
-   [ ] Content recommendations based on current feeds

### Social Features

-   [ ] Upvoting system
-   [ ] Educational institutions can access premium features for free

### Privacy & Security

-   [ ] All personal data kept on device
-   [ ] Free version completely local
-   [ ] Account system for premium features with no personal data transmission
-   [ ] End-to-end encryption for any necessary data sync

---

### Development Notes

-   Primary Stack: HTML, CSS, JavaScript
-   Server Component: Node.js based
-   Focus on privacy-first, local-first architecture
-   Premium features designed to enhance rather than restrict core functionality
