# Design Rationale

> The reasoning behind every significant decision in this automation framework.

---

## 1 · Language & Framework

**Stack:** TypeScript · Playwright · FastAPI · Allure 3 · GitHub Actions

### Why Playwright over Selenium?

Playwright ships with a built-in test runner, assertion library, trace viewer, HTML reporter, and a first-class API testing layer — all from a single install. Selenium requires assembling five or six separate libraries to reach the same surface area, and its synchronous WebDriver protocol means every interaction crosses a network hop to a driver binary. Playwright's CDP/BiDi channels run in-process and include auto-waiting on every action, eliminating an entire category of flakiness before a single line of test code is written.

> **When Selenium is the right call:** the organisation already runs a mature Selenium Grid, needs IE11 or legacy browser support, or operates in a Java shop where REST Assured + JUnit 5 is the firm standard. Neither tool is wrong — the question is always which your team can maintain.

### Why TypeScript?

The type system catches misrouted locators, schema mismatches, and typos at compile time — before CI ever starts. The `Post` interface is the contract; it documents the API without a comment.

---

## 2 · Anti-flakiness Strategy

Four techniques, applied in layers:

1. **Playwright auto-wait on every action.**  
   `click()`, `fill()`, `selectOption()` all wait for the target to be attached, visible, enabled, and stable before acting. No explicit waits needed for 90 % of interactions.

2. **Condition-based explicit waits where needed.**  
   The `waitForVisible()` helper in `BasePage` calls `locator.waitFor({ state: 'visible' })` — a pure condition check, never a fixed sleep. `expectOnInventoryPage()` waits for the inventory list before asserting.

3. **`data-test` attribute selectors.**  
   SauceDemo exposes `data-test` on every interactive element. `getByTestId()` binds to structural intent, not visual layout — a CSS class rename or style refactor cannot break these selectors.

4. **Full browser-context isolation per test.**  
   Playwright creates a fresh browser context (cookies, local storage, session storage) for every test by default. No shared mutable session state between tests — parallel execution cannot produce interference.

> **At scale (1 000+ tests):** flaky test quarantine via a dedicated `@quarantine` tag + separate retry pipeline; test result tracking in a time-series DB to surface intermittents statistically; `page.route()` mocking for tests that touch unstable third-party APIs; a pre-merge check that blocks PRs re-introducing known-flaky patterns (sleep, implicit wait).

---

## 3 · Parallelism & Isolation

Tests are isolated at the browser-context level. Playwright allocates a new context per test, so parallel workers never share cookies, storage, or authenticated sessions.

The first thing that breaks when parallelism is turned up aggressively is the target server's rate limiter. JSONPlaceholder is public and rate-limits at roughly 100 req/min. The `retries: 2` in `playwright.config.ts` absorbs transient network hiccups in CI without hiding genuine failures.

---

## 4 · Fixture Architecture

The fixture layer is split into four files connected by chained `test.extend()` calls. Each file owns one responsibility; `index.ts` re-exports the final composed `test` and the `AppFixtures` type.

| File | Fixtures |
|---|---|
| `pages.ts` | `loginPage`, `inventoryPage`, `cartPage`, `checkoutPage` |
| `api.ts` | `apiClient`, `postsApi`, `healthApi`, `mockApi` (route stub + auto-teardown) |
| `auth.ts` | `authenticatedInventory` (navigate to inventory, session already active via storageState) |
| `auto.ts` | `_serverLinks` (auto) · `_failureCapture` (auto, screenshot + video + trace on failure) |

**Why fixtures over `beforeEach`?**  
Fixtures are composable, type-safe, and automatically torn down. They allow fine-grained dependency injection — a test that only needs `postsApi` pays zero cost for page objects it never touches.

### Storage-state login

All UI tests share a single authenticated session via Playwright's `storageState` mechanism:

1. A dedicated `setup` project runs `tests/auth.setup.ts` **once** before any UI test.
2. The setup logs in as `standard_user` and writes `page.context().storageState()` to `.auth/user.json`.
3. The `chromium` project declares `dependencies: ['setup']` and `storageState: '.auth/user.json'`.
4. `authenticatedInventory` simply navigates to `/inventory.html` — the session is already active.

This reduces login round-trips from O(n tests) to O(1 per run, shared across workers).

---

## 5 · Reporting & Triage

If a test fails in CI at 3am, the on-call engineer opens the GitHub Actions run and downloads two artifacts: `playwright-report` and `test-results`.

`playwright-report` is the HTML report — one click shows every test, its duration, and a screenshot of the failing state. `test-results` contains Playwright traces (`.zip` files) that can be opened with `npx playwright show-trace trace.zip`. A trace is a full timeline of every network request, DOM mutation, and user action, with a screenshot at each step — the difference between *"I know the test failed"* and *"I know why it failed."*

> **3am triage flow:** open report → find failing test → open trace → find the first divergence from expected state → correlate with network tab → open bug with exact reproduction steps.

The **Allure 3 report** is deployed to GitHub Pages after every push to `main`. History trend is preserved across runs via `actions/cache` — the `history/` folder is restored before generation and saved after, so trend graphs accumulate over time without requiring a token or an external artifact action.

The **Grafana dashboard** surfaces test run metrics in real time. Stat panels use `last_over_time(...[3h])` to survive Prometheus staleness — without it, panels reset to 0 five minutes after each run completes.

### CI/CD pipeline — parallel job structure

The pipeline is split into five jobs to maximise concurrency and apply least-privilege permissions per job:

| Job | Depends on | Parallel with | Permissions |
|---|---|---|---|
| **typecheck** | — | `test` | `contents: read` |
| **test** | — | `typecheck` | `contents: read` |
| **report** | `test` | `summary` | `contents: read` |
| **summary** | `test` | `report` | `contents: read` |
| **deploy-pages** | `report` | — | `contents: read` · `pages: write` · `id-token: write` |

`typecheck` and `test` start simultaneously on every push. The moment `test` finishes (pass or fail), `report` and `summary` launch in parallel — Allure generation and step-summary writing no longer block each other. Java is installed only in `report`, keeping the `test` runner lean. The `pages: write` and `id-token: write` tokens are held exclusively by `deploy-pages` — no other job in the workflow can trigger a Pages deployment.

---

## 6 · Clean Code & SOLID Compliance

### SOLID principles

| Principle | How it is applied |
|---|---|
| **S — Single Responsibility** | Every class owns exactly one concern. `ApiService` (base HTTP delegation) lives in its own `ApiService.ts`; `PostsApi` and `HealthApi` only define endpoint methods. `BasePage` holds navigation helpers only. Each fixture file (`pages`, `api`, `auth`, `auto`) owns one fixture group. |
| **O — Open/Closed** | `ApiService` is abstract — new API surfaces (`PostsApi`, `HealthApi`) extend it without modifying it. The fixture chain (`pages → api → auth → auto`) extends each layer without touching prior files. |
| **L — Liskov Substitution** | `PostsApi` and `HealthApi` are substitutable for `ApiService` anywhere the base is expected. All page objects are substitutable for `BasePage`. No overrides break the base contract. |
| **I — Interface Segregation** | `RequestOptions` is fully optional — callers set only what they need. `CustomerInfo`, `Post`, `CreatePostPayload`, `UpdatePostPayload` are minimal focused interfaces. No fat interfaces exist. |
| **D — Dependency Inversion** | `ApiClient` receives its `baseUrl` and `timeout` via constructor injection, not by reading config directly inside methods. Page objects depend on the `Page` abstraction from Playwright, not on concrete browser implementations. |

### Clean code decisions

| Issue | Fix applied |
|---|---|
| `ApiService` defined in `PostsApi.ts` | Extracted to `ApiService.ts`; `HealthApi` no longer imports its base from an unrelated file |
| Magic numbers `3` (retries) and `200` (backoff ms) | Named constants `DEFAULT_RETRIES` and `RETRY_BACKOFF_MS` in `ApiClient.ts` |
| `as never` casts on `page.route()` / `page.unroute()` | Introduced `RouteHandler` type alias (`(route, request) => Promise<void>`); casts eliminated |
| `'chromium'` hardcoded string in `_failureCapture` | Replaced with `UI_PROJECTS = new Set(['chromium', 'firefox', 'webkit'])` — OCP-compliant, new projects need no fixture edit |
| `'video/webm' as never` | Removed; `allureAttachment` accepts the MIME string directly |
| All config defaults hardcoded as inline strings | Extracted to `config.json`; `config.ts` imports it as typed defaults — env vars still override |
| `ApiClient` fallback timeout was magic `30_000` literal | Replaced with `config.api.timeout` sourced from `config.json` |
| `workflows` fixture instantiated on every UI test but never used | Removed; `AuthWorkflow` / `CartWorkflow` / `CheckoutWorkflow` are available for future higher-level test composition |
| Hardcoded `10_000` timeout in `auth.ts` `waitForURL` | Replaced with `config.playwright.defaultTimeout` |
| `ApiService` missing `patch()` | Added; now fully mirrors `ApiClient`'s HTTP verb surface |

---

## 7 · What I Would Build Next

| Initiative | Impact | How |
|---|---|---|
| **Contract testing (Pact)** | API team gets a build failure before any UI test runs | Consumer-driven contracts published to Pact Broker; CI fails if the provider breaks the schema |
| **Visual regression** | Catches unintended UI changes invisible to functional tests | Playwright's `toHaveScreenshot()` with baseline images stored in the repo |
| **Flaky test quarantine** | Stops intermittents from blocking merges without hiding them | Tag flaky tests `@quarantine`, run in a separate job, report to a tracking board |
| **Parallel sharding** | Linear CI time reduction as the suite grows | `--shard=1/N` across N runners; Allure merges all result shards |

---

## 7 · AI Tools Used

This framework was architected and iteratively improved with **Claude (Anthropic)**. Claude was used for initial scaffolding, fixture composition patterns, CI/CD pipeline design, Grafana dashboard query fixes, and structural refactoring. All design decisions — selector strategy, isolation model, retry policy, fixture split — were made by the author and are documented above.
