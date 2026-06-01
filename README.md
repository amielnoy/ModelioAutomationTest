# ModelioAutomationTest

Production-grade Playwright + TypeScript automation framework covering **UI** (SauceDemo), **REST API** (JSONPlaceholder), and a **FastAPI health service** that monitors both. 18 tests run fully in parallel across three Playwright projects and are reported in Allure 3, deployed to GitHub Pages on every push to `main`.

**Live Allure report →** https://amielnoy.github.io/ModelioAutomationTest/

---

## Stack

| Layer | Technology |
|---|---|
| Test runner | Playwright 1.x · TypeScript · `fullyParallel` · 4 workers |
| UI target | SauceDemo (`https://www.saucedemo.com`) |
| API target | JSONPlaceholder (`https://jsonplaceholder.typicode.com`) |
| Health service | FastAPI (Python 3.12) — probes both SUTs, exposes `/metrics` |
| Monitoring | Prometheus + Grafana (Docker Compose) |
| Reporting | Allure 3 (GitHub Pages) · Playwright HTML · JUnit XML |
| CI/CD | GitHub Actions — 5-job parallel pipeline |

---

## Prerequisites

| Tool | Required for |
|---|---|
| Node.js ≥ 20 | Tests, reports |
| npm ≥ 10 | Dependency management |
| Java 17+ | Allure report generation (local) |
| Python 3.12 | Health API (local, non-Docker) |
| Docker + Compose | Full local stack (optional) |

---

## Quick start

```bash
# 1. Clone and install
git clone <repo-url>
cd ModelioAutomationTest
npm ci
npx playwright install --with-deps chromium

# 2. (Optional) copy env file for local overrides
cp .env.example .env

# 3. Run all tests
npm test
```

No secrets are required — SauceDemo credentials are publicly listed on its login page.

---

## Run commands

```bash
npm test                      # all tests (UI + API + health), 4 workers
npm run test:ui               # UI tests only (Chromium)
npm run test:api              # API tests only (JSONPlaceholder + health)
npm run test:headed           # headed browser (debug mode)
npm run test:parallel         # explicit --workers=4

npm run typecheck             # tsc --noEmit
```

### Run by tag

```bash
npx playwright test --grep "@ui"            # 7 UI tests (login, cart, checkout, sorting)
npx playwright test --grep "@api"           # 6 API tests (JSONPlaceholder CRUD)
npx playwright test --grep "@health-check"  # 5 health tests (FastAPI endpoints + OpenAPI)
```

### With the full local stack (Docker Compose)

```bash
./run.sh all        # start health API + Prometheus + Grafana, run tests, open Allure
./run.sh ui         # UI tests only
./run.sh api        # API + health tests only
./run.sh report     # regenerate and open the Allure report
./run.sh clean      # tear down containers and remove report artifacts
```

Grafana dashboard → http://localhost:3000  
Swagger UI → http://localhost:8000/docs  
Prometheus → http://localhost:9090

---

## Reports

### Playwright HTML (fast local review)
```bash
npm run report
# opens playwright-report/index.html
```

### Allure 3 (rich: steps, history trend, categories, environment)
```bash
npm run report:allure         # local — generates + opens in browser
npm run report:allure:ci      # CI — generate only (no open)
```

After every CI run `playwright-report` and `allure-report` are available as downloadable GitHub Actions artifacts (14-day retention). The Allure report is also deployed to GitHub Pages automatically.

### On failure, every test attaches
- Full-page screenshot
- Playwright trace — open with `npx playwright show-trace <file.zip>`
- Video (retained on failure)
- Allure step timeline with named steps and API request/response bodies

---

## CI/CD pipeline

`.github/workflows/tests.yml` — triggers on every push and pull request to `main`.

Five jobs run in two parallel waves with per-job minimal permissions:

```
push
 ├── typecheck  (contents: read)          — tsc --noEmit, ~1 min
 └── test       (contents: read)          — install → run → upload artifacts
       ├── report  (contents: read)       — Allure generate → Pages artifact
       └── summary (contents: read)       — step summary + server links
             └── deploy-pages  (pages: write + id-token: write)
```

`typecheck` and `test` start simultaneously. `report` and `summary` fan out the moment `test` finishes. Only `deploy-pages` holds the `pages: write` token.

---

## Project structure

```
├── tests/
│   ├── constants.ts          # shared test data (products, payloads, credentials)
│   ├── auth.setup.ts         # login once → .auth/user.json (storageState)
│   ├── ui/
│   │   ├── login.spec.ts     # happy path + invalid credentials
│   │   ├── cart.spec.ts      # add items, badge count
│   │   └── checkout.spec.ts  # end-to-end + price sorting
│   └── api/
│       ├── posts.spec.ts     # CRUD on /posts (JSONPlaceholder)
│       └── health.spec.ts    # FastAPI health endpoints + OpenAPI spec
│
├── src/
│   ├── pages/                # Page Object Model (BasePage, LoginPage, InventoryPage, …)
│   ├── api/                  # ApiClient · ApiService · PostsApi · HealthApi · ApiConstants
│   ├── fixtures/             # chained test.extend() — pages → api → auth → auto
│   │   ├── pages.ts          # page object fixtures
│   │   ├── api.ts            # apiClient, postsApi, healthApi, mockApi
│   │   ├── auth.ts           # authenticatedInventory (storageState session)
│   │   ├── auto.ts           # _serverLinks, _failureCapture (auto)
│   │   └── index.ts          # re-exports composed test + AppFixtures type
│   ├── workflows/            # AuthWorkflow · CartWorkflow · CheckoutWorkflow
│   ├── reporters/            # SummaryReporter — CLI table after every run
│   └── utils/                # allure.ts · config.ts · logger.ts · global-setup.ts
│
├── health_api/               # FastAPI service (Python 3.12)
│   ├── main.py               # /health · /health/ui · /metrics · /docs
│   └── requirements.txt
│
├── prometheus/               # prometheus.yml — scrape config
├── grafana/                  # provisioned datasource + 11-panel dashboard
│
├── .github/workflows/
│   └── tests.yml             # 5-job parallel CI pipeline
│
├── playwright.config.ts
├── docker-compose.yml        # health-api + prometheus + grafana + tests
├── Dockerfile                # Playwright image with Java for Allure
├── run.sh                    # ./run.sh [all|ui|api|report|clean]
├── config.json               # default values for all env vars
├── Architecture.html         # interactive architecture diagram
└── DESIGN.md                 # design rationale and decision log
```

---

## Configuration

All runtime config is read from environment variables (or `.env` for local runs). Default values live in `config.json` — `config.ts` imports them as typed defaults and env vars override. No URLs or credentials are hardcoded in test or source files.

| Variable | Default | Description |
|---|---|---|
| `WEB_BASE_URL` | `https://www.saucedemo.com` | UI target |
| `API_BASE_URL` | `https://jsonplaceholder.typicode.com` | API target |
| `HEALTH_API_URL` | `http://localhost:8000` | FastAPI health service |
| `STANDARD_USER` | `standard_user` | SauceDemo login (GitHub secret in CI) |
| `STANDARD_PASSWORD` | `secret_sauce` | SauceDemo password (GitHub secret in CI) |
| `LOCKED_USER` | `locked_out_user` | SauceDemo locked account |
| `BROWSER` | `chromium` | Browser project |
| `WORKERS` | `4` | Parallel worker count |
| `DEFAULT_TIMEOUT` | `30000` | Action + assertion timeout (ms) |
| `NAVIGATION_TIMEOUT` | `30000` | Page navigation timeout (ms) |

---

## Architecture & design

- **[Architecture.html](Architecture.html)** — interactive diagram: test runner, fixture chain, API layer, CI pipeline, infrastructure
- **[DESIGN.md](DESIGN.md)** — rationale for every significant decision (Playwright vs Selenium, fixture split, storage-state login, anti-flakiness layers, SOLID compliance, parallel pipeline)
