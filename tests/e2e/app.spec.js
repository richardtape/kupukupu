import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('App Loading', () => {
    test('loads successfully in browser', async ({ page }) => {
        // Set up console message capture before navigation
        const messages = [];
        page.on('console', msg => messages.push(msg.text()));

        // Navigate to the app
        await page.goto('/');

        // Check if the app div exists and contains correct content
        await expect(page.locator('#app')).toBeVisible();
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('h1')).toHaveText('Kupukupu');

        // Wait for initialization with a more specific condition
        await expect.poll(
            () => messages.some(m => m.includes('Running in browser mode')),
            {
                message: 'Waiting for environment message',
                timeout: 5000,
            }
        ).toBe(true);
    });

    test('is accessible', async ({ page }) => {
        // Navigate to the app
        await page.goto('/');

        // Wait for the main content
        await expect(page.locator('main#app')).toBeVisible();

        // Run accessibility tests
        const accessibilityScanResults = await new AxeBuilder({ page })
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });
});