import { test as apiTest } from './api';
import { InventoryPage } from '../pages';
import { config } from '../utils/config';

export type AuthFixtures = {
  authenticatedInventory: InventoryPage;
};

export const test = apiTest.extend<AuthFixtures>({
  // storageState is applied at the project level (playwright.config.ts → chromium project).
  // The session is already active — navigate directly to inventory without re-logging in.
  authenticatedInventory: async ({ page }, use) => {
    await page.goto('/inventory.html');
    // Guard: if session is missing/expired the app redirects to login silently.
    await page.waitForURL(/inventory/, { timeout: config.playwright.defaultTimeout });
    await use(new InventoryPage(page));
  },
});
