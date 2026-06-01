# Design Rationale

## Language and framework choice

**TypeScript + Playwright Test.**

Playwright was the obvious choice over Selenium for this assignment. It ships with a built-in test runner, assertion library, trace viewer, HTML reporter, and a first-class API testing layer — all from a single install. Selenium requires assembling five or six separate libraries to reach the same surface area, and its synchronous WebDriver protocol means every interaction crosses a network hop to a driver binary. Playwright's CDP/BiDi channels run in-process and include auto-waiting on every action, which eliminates an entire category of flakiness before I write a single line of test code.

I would still choose Selenium if the organisation already runs a mature Selenium Grid, needs IE11 or legacy browser support, or operates in a Java shop where the REST Assured + JUnit 5 ecosystem is the firm standard. Neither is wrong; the question is always which tool your team can maintain.

TypeScript over plain JavaScript because the type system catches misrouted locators, schema mismatches, and typos at compile time — before CI ever starts. It also makes the API layer self-documenting (the `Post` interface is the contract, not a comment).

## Anti-flakiness strategy

Four concrete techniques, applied in layers:

1. **Playwright auto-wait on every action.** `click()`, `fill()`, `selectOption()` all wait for the target to be attached, visible, enabled, and stable before acting. No explicit waits are needed for 90% of interactions.

2. **Condition-based explicit waits where needed.** The `waitForVisible()` helper in `BasePage` calls `locator.waitFor({ state: 'visible' })` — a pure condition check, never a fixed sleep. The same pattern applies to `expectOnInventoryPage()` which waits for the inventory list before asserting.

3. **data-test attribute selectors.** Swag Labs exposes `data-test` on every interactive element. `getByTestId()` binds to structural intent, not visual layout — a CSS class rename or style refactor cannot break these selectors.

4. **Full browser-context isolation per test.** Playwright creates a fresh browser context (cookies, local storage, session storage) for every test by default. There is no shared mutable session state between tests, so parallel execution cannot produce interference.

At scale (1000+ tests) I would add: flaky test quarantine via a dedicated tag and separate retry pipeline; test result tracking in a time-series database to surface intermittents statistically; server-side request mocking (Playwright's `route()`) for tests that touch unstable third-party APIs; and a pre-merge check that blocks PRs if a test is re-introduced with a known-flaky pattern (sleep, implicit wait).

## Parallelism and isolation

Tests are isolated at the browser-context level. Playwright allocates a new context per test, so parallel workers never share cookies, storage, or authenticated sessions. The `authenticatedInventory` fixture performs a full login inside each test's context — there is no shared login state to corrupt.

The first thing that breaks when parallelism is turned up aggressively is the target server's rate limiter. JSONPlaceholder is public and rate-limits at roughly 100 req/min. Swag Labs is single-tenant demo infrastructure; in theory it can handle any load, but a very high worker count could produce network timeouts that look like flakiness. The `retries: 2` in `playwright.config.ts` absorbs transient network hiccups in CI without hiding genuine failures.

Run UI tests in parallel with 4 workers:

```
npx playwright test --project=chromium tests/ui --workers=4
```

## Reporting and triage

If a test fails in CI at 3am, the on-call engineer opens the GitHub Actions run and downloads two artifacts: `playwright-report` and `test-results`.

`playwright-report` is the HTML report — one click shows every test, its duration, and a screenshot of the failing state. `test-results` contains Playwright traces (`.zip` files) that can be opened with `npx playwright show-trace trace.zip`. A trace is a full timeline of every network request, DOM mutation, and user action, with a screenshot at each step. It is the diff between "I know the test failed" and "I know *why* it failed."

For a 3am incident: open report → find failing test → open trace → find the first divergence from expected state → correlate with network tab in trace → open bug with exact reproduction steps.

## What I would build next

The first thing I would add is a **storage-state fixture for authenticated tests**. Right now every test in the `authenticatedInventory` fixture performs a real login via HTTP. With `page.context().storageState()` I can log in once, serialise the session to disk, and reuse it across all tests in a worker — cutting login time from O(n tests) to O(1 per worker). This is the highest-leverage optimisation for a growing suite.

After that: **contract testing** (Pact) between the UI layer and the API. Right now I assert API responses with `toMatchObject` — that is a consumer-side check. Pact publishes the consumer contract to a broker so the API team gets a build failure if they break the schema, before any UI test is even run.

## AI tools used

This framework was architected and written with Claude (Anthropic). Claude was used for: initial file scaffolding, fixture composition patterns, and reviewing the final structure for consistency. All design decisions — selector strategy, isolation model, retry policy, fixture vs. beforeEach trade-offs — were made by the author and are documented above.
