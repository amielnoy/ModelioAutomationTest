import { test as apiTest } from './api';
import { InventoryPage } from '../pages';
import { AuthWorkflow } from '../workflows/AuthWorkflow';
import { CartWorkflow } from '../workflows/CartWorkflow';
import { CheckoutWorkflow } from '../workflows/CheckoutWorkflow';

export type WorkflowFixtures = {
  workflows: {
    auth: AuthWorkflow;
    cart: CartWorkflow;
    checkout: CheckoutWorkflow;
  };
};

export type AuthFixtures = {
  authenticatedInventory: InventoryPage;
};

export const test = apiTest.extend<WorkflowFixtures & AuthFixtures>({
  workflows: async ({ page }, use) => {
    const auth = new AuthWorkflow(page);
    const cart = new CartWorkflow(page);
    const checkout = new CheckoutWorkflow(page);
    await use({ auth, cart, checkout });
  },

  // storageState is applied at the project level (playwright.config.ts → chromium project).
  // The session is already active — navigate directly to inventory without re-logging in.
  authenticatedInventory: async ({ page }, use) => {
    await page.goto('/inventory.html');
    await use(new InventoryPage(page));
  },
});
