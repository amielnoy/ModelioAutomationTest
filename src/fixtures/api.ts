import { Route } from '@playwright/test';
import { test as pagesTest } from './pages';
import { ApiClient, PostsApi, HealthApi } from '../api';
import { config } from '../utils/config';

export type ApiFixtures = {
  apiClient: ApiClient;
  postsApi: PostsApi;
  healthApi: HealthApi;
  mockApi: {
    route: (urlPattern: string | RegExp, status: number, body: unknown) => Promise<() => Promise<void>>;
  };
};

export const test = pagesTest.extend<ApiFixtures>({
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

  healthApi: async ({ request }, use) => {
    const client = new ApiClient(request, { baseUrl: config.health.apiUrl });
    await use(new HealthApi(client));
  },

  mockApi: async ({ page }, use) => {
    const routes: Array<{ pattern: string | RegExp; handler: (route: Route) => Promise<void> }> = [];

    const routeFn = async (urlPattern: string | RegExp, status: number, body: unknown) => {
      const handler = async (route: Route) => {
        await route.fulfill({ status, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      };
      routes.push({ pattern: urlPattern, handler });
      await page.route(urlPattern as never, handler);
      return async () => {
        await page.unroute(urlPattern as never, handler);
      };
    };

    await use({ route: routeFn });

    for (const r of routes) {
      await page.unroute(r.pattern as never, r.handler);
    }
  },
});
