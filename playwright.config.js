import { defineConfig, devices } from '@playwright/test';

// Default to port 3000 for browser, 3001 for electron
const PORT = process.env.PORT || (process.env.NODE_ENV === 'development' ? '3001' : '3000');
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        video: 'on-first-retry'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        }
    ],
    webServer: {
        command: process.env.NODE_ENV === 'development'
            ? 'npm run electron:dev'
            : 'npm start',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120000, // Giving it more time to start up
    },
    globalSetup: './tests/setup/playwright.setup.js'
});