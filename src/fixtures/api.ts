import { Route, Request } from '@playwright/test';
import { test as pagesTest } from './pages';
import { ApiClient, PostsApi, HealthApi } from '../api';
import { config } from '../utils/config';

type RouteHandler = (route: Route, request: Request) => Promise<void>;

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
    const routes: Array<{ pattern: string | RegExp; handler: RouteHandler }> = [];

    const routeFn = async (urlPattern: string | RegExp, status: number, body: unknown) => {
      const handler: RouteHandler = async (route) => {
        await route.fulfill({ status, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      };
      routes.push({ pattern: urlPattern, handler });
      await page.route(urlPattern, handler);
      return async () => {
        await page.unroute(urlPattern, handler);
      };
    };

    await use({ route: routeFn });

    for (const r of routes) {
      await page.unroute(r.pattern, r.handler);
    }
  },
});
