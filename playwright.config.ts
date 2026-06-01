import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env for local runs; CI injects vars directly.
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { config } from './src/utils/config';

export default defineConfig({
  // ── Global settings ─────────────────────────────────────────────────────
  globalSetup: './src/utils/global-setup.ts',
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : config.playwright.workers,
  timeout: config.playwright.defaultTimeout,
  expect: { timeout: config.playwright.defaultTimeout },

  // ── Reporters ────────────────────────────────────────────────────────────
  // Three reporters run simultaneously:
  //   1. Playwright HTML  — fast local review, always generated
  //   2. Allure           — rich history, categories, steps, environment info
  //   3. JUnit XML        — parseable by CI dashboards and other tooling
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    [
      'allure-playwright',
      {
        // Where raw Allure result JSON files are written (one per test).
        // Run `npm run report:allure:ci` (or `npm run report:allure` locally)
        // after the test run to compile them into the static HTML report.
        resultsDir: 'allure-results',
        // Step detail comes from our allureStep() wrappers; setting detail:false
        // prevents allure-playwright from attaching the trace as an interactive
        // viewer that fetches the zip cross-origin (fails on GitHub Pages CORS).
        detail: false,
        // Suites are mapped from test.describe labels.
        suiteTitle: true,
        // Environment metadata shown on the Allure report overview page.
        environmentInfo: {
          node_version: process.version,
          playwright_version: require('@playwright/test/package.json').version,
          os: process.platform,
          ci: process.env.CI ? 'true' : 'false',
          web_base_url: config.web.baseUrl,
          api_base_url: config.api.baseUrl,
          browser: config.playwright.browser,
          workers: String(config.playwright.workers),
          default_timeout_ms: String(config.playwright.defaultTimeout),
          swagger_ui: `${config.health.apiUrl}/docs`,
          fastapi: config.health.apiUrl,
          grafana: config.health.grafanaUrl,
          allure_report: config.health.allureReportUrl,
        },
      },
    ],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    // Console list for live CI output
    ['list'],
    // Custom summary table printed after every run
    ['./src/reporters/SummaryReporter.ts'],
  ],

  // ── Global use ───────────────────────────────────────────────────────────
  use: {
    // Capture on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    testIdAttribute: 'data-test',
    // DOM snapshot on failure is captured automatically via trace

    navigationTimeout: config.playwright.navigationTimeout,
    actionTimeout: config.playwright.defaultTimeout,
  },

  // ── Projects ─────────────────────────────────────────────────────────────
  projects: [
    // Login once and persist session to .auth/user.json
    {
      name: 'setup',
      testMatch: 'tests/auth.setup.ts',
      use: { baseURL: config.web.baseUrl },
    },

    // UI tests run in real browsers — reuse the saved session
    {
      name: 'chromium',
      testMatch: 'tests/ui/**/*.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.web.baseUrl,
        storageState: '.auth/user.json',
      },
    },
    // API tests use a headless "browser-less" project
    {
      name: 'api',
      testMatch: 'tests/api/posts*.spec.ts',
      use: {
        baseURL: config.api.baseUrl,
      },
    },

    // Health checks against the FastAPI service
    {
      name: 'health',
      testMatch: 'tests/api/health.spec.ts',
      use: {
        baseURL: config.health.apiUrl,
      },
    },
  ],

  // Output directory for traces, screenshots, videos
  outputDir: 'test-results/',
});
