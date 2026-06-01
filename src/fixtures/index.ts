import { test as base, expect } from '@playwright/test';
import { LoginPage, InventoryPage, CartPage, CheckoutPage } from '../pages';
import { AuthWorkflow } from '../workflows/AuthWorkflow';
import { CartWorkflow } from '../workflows/CartWorkflow';
import { CheckoutWorkflow } from '../workflows/CheckoutWorkflow';
import { ApiClient, PostsApi } from '../api';
import { config } from '../utils/config';
import { APIRequestContext, Route } from '@playwright/test';

/**
 * Custom fixture set.
 *
 * Why fixtures instead of beforeEach?
 * – Fixtures are composable, type-safe, and automatically torn down.
 * – Each test gets its own browser context (Playwright default) so tests
 *   are fully isolated at the browser-session level — no shared cookies/storage.
 * – The `authenticatedPage` fixture handles login once per test so individual
 *   tests stay focused on their scenario, not on setup ceremony.
 */

type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

type ApiFixtures = {
  apiClient: ApiClient;
  postsApi: PostsApi;
  mockApi: {
    /**
     * Stub a network endpoint matching `urlPattern` with given status and body.
     * Returns an `unroute()` function to remove the stub early if required.
     */
    route: (urlPattern: string | RegExp, status: number, body: unknown) => Promise<() => Promise<void>>;
  };
};

/** A fixture that lands on the inventory page as standard_user. */
type AuthFixtures = {
  authenticatedInventory: InventoryPage;
};

type WorkflowFixtures = {
  workflows: {
    auth: AuthWorkflow;
    cart: CartWorkflow;
    checkout: CheckoutWorkflow;
  };
};

export type AppFixtures = Pages & ApiFixtures & AuthFixtures & WorkflowFixtures;

export const test = base.extend<AppFixtures>({
  // ── Page objects ────────────────────────────────────────────────────────
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  // ── API layer ────────────────────────────────────────────────────────────
  apiClient: async ({ request }, use) => {
    const client = new ApiClient(request, {
      baseUrl: config.api.baseUrl,
      timeout: config.api.timeout,
    });
    await use(client);
  },

  postsApi: async ({ apiClient }, use) => {
    await use(new PostsApi(apiClient));
  },

  // ── Network mocking fixture ─────────────────────────────────────────────
  mockApi: async ({ page }, use) => {
    const routes: Array<{ pattern: string | RegExp; handler: (route: Route) => Promise<void> }> = [];

    const routeFn = async (urlPattern: string | RegExp, status: number, body: unknown) => {
      const handler = async (route: Route) => {
        await route.fulfill({ status, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      };
      routes.push({ pattern: urlPattern, handler });
      await page.route(urlPattern as any, handler);
      return async () => {
        await page.unroute(urlPattern as any, handler);
      };
    };

    await use({ route: routeFn });

    // Teardown: remove any registered routes
    for (const r of routes) {
      await page.unroute(r.pattern as any, r.handler);
    }
  },

  // ── Authenticated UI fixture ─────────────────────────────────────────────
  /**
   * Logs in as standard_user and lands on InventoryPage.
   * Each test gets its own isolated browser context (Playwright guarantees this).
   * Using the same credentials is fine because the app is stateless per session.
   */
  // Workflows fixture
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

export { expect };
