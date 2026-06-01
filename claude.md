Playwright Best Practices — concise guide

Purpose
- Practical, actionable Playwright patterns for reliable UI/API test automation.

Test Design
- Keep tests independent and idempotent: each test gets a fresh browser context.
- Small, focused tests: assert one behaviour per test when practical.
- Use fixtures for setup/teardown (authentication, seeded data), not shared global state.

Selectors & Locators
- Prefer stable attributes: `data-test` or `data-testid` over CSS classes or text.
- Encapsulate selectors in Page Objects; expose intentful methods (e.g., `login()`).
- Avoid brittle combinator selectors. Use `.getByTestId()` / `.getByRole()` when possible.

Fixtures & Test Isolation
- Use Playwright `test.extend()` to compose fixtures quietly and type-safely.
- Provide reusable fixtures for authenticated sessions, mocked APIs, and seeded data.
- Tear down external state in fixtures or after hook to avoid cross-test pollution.

Network Mocking & Services
- Mock network responses for UI tests where external services are nondeterministic.
- Use `page.route()` to stub responses; prefer fixture-driven mock data files.
- For contract/contract-like checks, run dedicated integration/API tests against real endpoints.

Syncing & Waiting
- Avoid arbitrary `sleep()`; rely on Playwright auto-wait and `locator.waitFor()` for explicit conditions.
- Prefer assertions on visible/attached elements over waiting for timeouts.
- For intermittent flakiness, add targeted `expect(locator).toBeVisible({ timeout: X })` instead of blanket longer timeouts.

Retries, Timeouts & Resilience
- Set conservative global timeouts in `playwright.config.ts`, tune per-flaky tests only when needed.
- Use retries on CI for transient failures; keep local runs fast (retries=0).
- For network calls, implement retry with exponential backoff in the service layer.

Tracing, Screenshots & Reporting
- Enable `trace`, `screenshot`, and `video` to retain artifacts on failure (`retain-on-failure`).
- Integrate with Allure or JUnit for CI reporting and historical debugging.
- Record traces for failed tests and teach teammates `npx playwright show-trace` usage.

CI & Parallelism
- Run UI tests in a single browser per job or shard across workers carefully; avoid shared state.
- Limit `workers` for headed/rich runs; use headless in CI for speed.
- Cache browser binaries or use Playwright's install step in CI to avoid download flakiness.

Best Practices Summary
- Encapsulate: Page Objects + fixtures + service layer.
- Observe: rely on auto-wait, assert meaningful UI state, capture artifacts.
- Isolate: fresh context per test and mock external systems where appropriate.

Examples
- Setting `testIdAttribute` in `playwright.config.ts`:

  testIdAttribute: 'data-test'

- Basic fixture pattern (TypeScript):

  export const test = base.extend({
    authenticatedPage: async ({ page }, use) => {
      // login once per test
      await page.goto('/');
      await page.getByTestId('username').fill(process.env.STANDARD_USER!);
      await page.getByTestId('password').fill(process.env.STANDARD_PASSWORD!);
      await page.getByTestId('login-button').click();
      await use(page);
    },
  });

- Mocking network with `route()` in a fixture:

  await page.route('**/api/posts', route => {
    route.fulfill({ status: 200, body: JSON.stringify(mockPosts) });
  });

 - Using a `mockApi` fixture (recommended):

   // in test signature: `async ({ mockApi }) => {`
   const unroute = await mockApi.route('**/api/posts', 200, mockPosts);
   // optionally remove stub early:
   await unroute();

Where to expand next
- Add concrete team conventions (naming, folder layout, commit hooks).
- Provide reusable mock data fixtures and a recording strategy for flaky external endpoints.

Authored by: automation helper
Date: 2026-06-01
