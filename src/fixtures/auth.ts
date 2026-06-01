import { test as apiTest } from './api';
import { InventoryPage } from '../pages';
import { AuthWorkflow } from '../workflows/AuthWorkflow';
import { CartWorkflow } from '../workflows/CartWorkflow';
import { CheckoutWorkflow } from '../workflows/CheckoutWorkflow';
import { config } from '../utils/config';

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

  authenticatedInventory: async ({ workflows }, use) => {
    const inventoryPage = await workflows.auth.login(
      config.web.credentials.standard.username,
      config.web.credentials.standard.password,
    );
    await use(inventoryPage);
  },
});
