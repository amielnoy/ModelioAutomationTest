/**
 * Centralised configuration — all values sourced from environment variables.
 * Never import raw process.env in test or page files; always go through here.
 */

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  // Treat empty string (e.g. unset GitHub secret) the same as missing
  if (!value) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  web: {
    baseUrl: requireEnv('WEB_BASE_URL', 'https://www.saucedemo.com'),
    credentials: {
      standard: {
        username: requireEnv('STANDARD_USER', 'standard_user'),
        password: requireEnv('STANDARD_PASSWORD', 'secret_sauce'),
      },
      locked: {
        username: requireEnv('LOCKED_USER', 'locked_out_user'),
        password: requireEnv('STANDARD_PASSWORD', 'secret_sauce'),
      },
    },
  },
  api: {
    baseUrl: requireEnv('API_BASE_URL', 'https://jsonplaceholder.typicode.com'),
    timeout: parseInt(requireEnv('DEFAULT_TIMEOUT', '30000'), 10),
  },
  health: {
    apiUrl:          requireEnv('HEALTH_API_URL',      'http://localhost:8000'),
    grafanaUrl:      requireEnv('GRAFANA_URL',          'http://localhost:3000'),
    allureReportUrl: requireEnv('ALLURE_REPORT_URL',   'https://amielnoy.github.io/ModelioAutomationTest/'),
  },
  playwright: {
    defaultTimeout: parseInt(requireEnv('DEFAULT_TIMEOUT', '30000'), 10),
    navigationTimeout: parseInt(requireEnv('NAVIGATION_TIMEOUT', '30000'), 10),
    workers: parseInt(requireEnv('WORKERS', '4'), 10),
    browser: (requireEnv('BROWSER', 'chromium') as 'chromium' | 'firefox' | 'webkit'),
  },
} as const;
