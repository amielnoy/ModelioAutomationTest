# QA Automation Assignment

Production-grade Playwright + TypeScript automation framework covering UI (Swag Labs) and API (JSONPlaceholder) tests.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| npm | ≥ 10 |

---

## Setup (under 5 minutes)

```bash
# 1. Clone
git clone <repo-url>
cd qa-automation-assignment

# 2. Install dependencies + Playwright browsers
npm ci
npx playwright install --with-deps chromium

# 3. (Optional) copy env file for local overrides
cp .env.example .env
```

No secrets required. All credentials used by this project are publicly listed on the Swag Labs login page.

---

## Run all tests

```bash
npm test
```

---

## Run specific suites

```bash
# UI tests only (Chromium)
npm run test:ui

# API tests only
npm run test:api

# All tests, headed browser (useful for debugging)
npm run test:headed
```

---

## Run in parallel (4 workers)

```bash
npm run test:parallel
# or explicitly:
npx playwright test --workers=4
```

Tests are isolated per browser context — parallel execution is safe with any worker count.

---

## View reports

### Playwright HTML report (fast local review)
```bash
npm run report
# Opens playwright-report/index.html in your browser
```

### Allure 3 report (rich: steps, categories, trends, environment)
```bash
npm run report:allure
# Generates allure-report/ from allure-results/ and opens it in browser
```

After a CI run, both `playwright-report` and `allure-report` are uploaded as downloadable artifacts (14-day retention).

Failed tests include:
- Screenshot of the failing state
- Playwright trace (open with `npx playwright show-trace <file.zip>`)
- Browser network log and DOM snapshot (inside the trace)
- Allure step timeline with named steps and attached API response bodies

---

## CI

GitHub Actions workflow: `.github/workflows/tests.yml`

Triggers on every push and pull request to `main`. The pipeline:
1. Installs dependencies and Playwright browsers
2. Type-checks with `tsc --noEmit`
3. Runs UI tests (Chromium, 4 workers) and API tests in parallel steps
4. Uploads `playwright-report` and `test-results` as downloadable artifacts (14-day retention)

See the **Actions** tab for the latest green run.

---

## Project structure

```
├── src/
│   ├── pages/          # Page Object Model (LoginPage, InventoryPage, CartPage, CheckoutPage)
│   ├── api/            # ApiClient wrapper + PostsApi endpoint helper
│   ├── fixtures/       # Playwright custom fixtures (authenticatedInventory, postsApi, …)
│   ├── types/          # Shared TypeScript types (Post, CreatePostPayload, …)
│   └── utils/          # config.ts — single source for all env-var config
├── tests/
│   ├── ui/             # login.spec.ts, cart.spec.ts, checkout.spec.ts
│   └── api/            # posts.spec.ts
├── .github/workflows/  # tests.yml
├── playwright.config.ts
├── DESIGN.md           # Architecture and trade-off rationale
└── README.md
```

---

## Configuration

All runtime config is read from environment variables (or `.env` for local runs). No URLs or credentials are hardcoded in test files.

| Variable | Default | Description |
|----------|---------|-------------|
| `WEB_BASE_URL` | `https://www.saucedemo.com` | UI target |
| `API_BASE_URL` | `https://jsonplaceholder.typicode.com` | API target |
| `STANDARD_USER` | `standard_user` | Swag Labs login |
| `STANDARD_PASSWORD` | `secret_sauce` | Swag Labs password |
| `BROWSER` | `chromium` | Browser project to use |
| `WORKERS` | `4` | Parallel worker count |
| `DEFAULT_TIMEOUT` | `30000` | Action timeout (ms) |
| `NAVIGATION_TIMEOUT` | `30000` | Page navigation timeout (ms) |
