import defaults from '../../config.json';

/**
 * Centralised configuration — env vars override defaults from config.json.
 * Never import raw process.env in test or page files; always go through here.
 */

function requireEnv(key: string, fallback: string): string {
  const value = process.env[key];
  // Treat empty string (e.g. unset GitHub secret) the same as missing
  return value || fallback;
}

export const config = {
  web: {
    baseUrl: requireEnv('WEB_BASE_URL', defaults.web.baseUrl),
    credentials: {
      standard: {
        username: requireEnv('STANDARD_USER', defaults.web.credentials.standardUser),
        password: requireEnv('STANDARD_PASSWORD', defaults.web.credentials.password),
      },
      locked: {
        username: requireEnv('LOCKED_USER', defaults.web.credentials.lockedUser),
        password: requireEnv('STANDARD_PASSWORD', defaults.web.credentials.password),
      },
    },
  },
  api: {
    baseUrl: requireEnv('API_BASE_URL', defaults.api.baseUrl),
    timeout: parseInt(requireEnv('DEFAULT_TIMEOUT', String(defaults.api.timeout)), 10),
  },
  health: {
    apiUrl:          requireEnv('HEALTH_API_URL',    defaults.health.apiUrl),
    grafanaUrl:      requireEnv('GRAFANA_URL',        defaults.health.grafanaUrl),
    allureReportUrl: requireEnv('ALLURE_REPORT_URL', defaults.health.allureReportUrl),
  },
  playwright: {
    defaultTimeout:    parseInt(requireEnv('DEFAULT_TIMEOUT',    String(defaults.playwright.defaultTimeout)), 10),
    navigationTimeout: parseInt(requireEnv('NAVIGATION_TIMEOUT', String(defaults.playwright.navigationTimeout)), 10),
    workers:           parseInt(requireEnv('WORKERS',            String(defaults.playwright.workers)), 10),
    browser: (requireEnv('BROWSER', defaults.playwright.browser) as 'chromium' | 'firefox' | 'webkit'),
  },
} as const;
