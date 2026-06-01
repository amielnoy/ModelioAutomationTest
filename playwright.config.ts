import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env for local runs; CI injects vars directly.
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { config } from './src/utils/config';

export default defineConfig({
  // ── Global settings ─────────────────────────────────────────────────────
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : config.playwright.workers,
  timeout: config.playwright.defaultTimeout,

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
        // Attach Playwright traces, screenshots, and videos to Allure results.
        detail: true,
        // Suites are mapped from test.describe labels.
        suiteTitle: true,
        // Environment metadata shown on the Allure report overview page.
        environmentInfo: {
          node_version: process.version,
          playwright_version: require('@playwright/test/package.json').version,
          os: process.platform,
          ci: process.env.CI ? 'true' : 'false',
        },
      },
    ],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    // Console list for live CI output
    ['list'],
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
    // UI tests run in real browsers
    {
      name: 'chromium',
      testMatch: 'tests/ui/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.web.baseUrl,
      },
    },
    // API tests use a headless "browser-less" project
    {
      name: 'api',
      testMatch: 'tests/api/**/*.spec.ts',
      use: {
        baseURL: config.api.baseUrl,
      },
    },
  ],

  // Output directory for traces, screenshots, videos
  outputDir: 'test-results/',
});
