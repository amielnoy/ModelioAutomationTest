import { test, expect } from '../../src/fixtures';
import { ApiConstants } from '../../src/api/ApiConstants';
import { SystemHealth, ServiceHealth } from '../../src/api';
import {
  allureEpic,
  allureFeature,
  allureStory,
  allureSeverity,
  allureStep,
  allureAttachment,
  allureRequirement,
  allureBug,
} from '../../src/utils/allure';
import { JiraLinks } from '../constants';

test.describe('Health API — /health', { tag: '@health-check' }, () => {
  test('GET /health/self — service is up', async ({ healthApi }) => {
    await allureEpic('Health');
    await allureFeature('Self');
    await allureStory('Service liveness');
    await allureSeverity('blocker');
    await allureRequirement(JiraLinks.requirements.HEALTH, 'PROJ-105 — Health API requirement');
    await allureBug(JiraLinks.bugs.HEALTH_DOWN, 'BUG-15 — Service health down');

    let response: Awaited<ReturnType<typeof healthApi.self>>;

    await allureStep('GET /health/self', async () => {
      response = await healthApi.self();
      await allureAttachment('Response', JSON.stringify(await response.json(), null, 2), 'application/json');
    });

    await allureStep('Assert 200 and status ok', async () => {
      expect(response!.status()).toBe(ApiConstants.OK);
      const body = await response!.json();
      expect(body.status).toBe('ok');
      expect(typeof body.uptime_seconds).toBe('number');
      expect(body.uptime_seconds).toBeGreaterThanOrEqual(0);
    });
  });

  test('GET /health — aggregated system health returns ok or degraded', async ({ healthApi }) => {
    await allureEpic('Health');
    await allureFeature('Aggregated');
    await allureStory('System health');
    await allureSeverity('critical');
    await allureRequirement(JiraLinks.requirements.HEALTH, 'PROJ-105 — Health API requirement');

    let body: SystemHealth;

    await allureStep('GET /health', async () => {
      const response = await healthApi.all();
      body = await response.json();
      await allureAttachment('Response', JSON.stringify(body, null, 2), 'application/json');
      expect(response.status()).toBe(ApiConstants.OK);
    });

    await allureStep('Assert overall status is not "down"', async () => {
      expect(['ok', 'degraded']).toContain(body!.status);
    });

    await allureStep('Assert services map contains web_ui and json_api', async () => {
      expect(body!.services).toHaveProperty('web_ui');
      expect(body!.services).toHaveProperty('json_api');
    });

    await allureStep('Assert uptime and timestamp are present', async () => {
      expect(body!.uptime_seconds).toBeGreaterThanOrEqual(0);
      expect(new Date(body!.timestamp).getTime()).not.toBeNaN();
    });
  });

  test('GET /health/ui — SauceDemo UI is reachable', async ({ healthApi }) => {
    await allureEpic('Health');
    await allureFeature('UI');
    await allureStory('Web UI reachability');
    await allureSeverity('critical');
    await allureRequirement(JiraLinks.requirements.HEALTH, 'PROJ-105 — Health API requirement');

    let body: ServiceHealth;

    await allureStep('GET /health/ui', async () => {
      const response = await healthApi.ui();
      body = await response.json();
      await allureAttachment('Response', JSON.stringify(body, null, 2), 'application/json');
      expect(response.status()).toBe(ApiConstants.OK);
    });

    await allureStep('Assert UI is ok or degraded (not down)', async () => {
      expect(['ok', 'degraded']).toContain(body!.status);
      expect(body!.http_status).toBeLessThan(500);
      expect(body!.latency_ms).toBeGreaterThan(0);
    });
  });

  test('GET /health/api — JSONPlaceholder API is reachable', async ({ healthApi }) => {
    await allureEpic('Health');
    await allureFeature('API');
    await allureStory('REST API reachability');
    await allureSeverity('critical');
    await allureRequirement(JiraLinks.requirements.HEALTH, 'PROJ-105 — Health API requirement');

    let body: ServiceHealth;

    await allureStep('GET /health/api', async () => {
      const response = await healthApi.api();
      body = await response.json();
      await allureAttachment('Response', JSON.stringify(body, null, 2), 'application/json');
      expect(response.status()).toBe(ApiConstants.OK);
    });

    await allureStep('Assert API is ok and returns 200', async () => {
      expect(body!.status).toBe('ok');
      expect(body!.http_status).toBe(ApiConstants.OK);
      expect(body!.latency_ms).toBeGreaterThan(0);
    });
  });
});

test.describe('Health API — Swagger / OpenAPI', { tag: '@health-check' }, () => {
  test('GET /openapi.json — spec is valid and lists all health endpoints', async ({ healthApi }) => {
    await allureEpic('Health');
    await allureFeature('Swagger');
    await allureStory('OpenAPI spec');
    await allureSeverity('normal');
    await allureRequirement(JiraLinks.requirements.HEALTH, 'PROJ-105 — Health API requirement');

    let spec: Record<string, unknown>;

    await allureStep('GET /openapi.json', async () => {
      const response = await healthApi.openapi();
      spec = await response.json();
      await allureAttachment('OpenAPI spec', JSON.stringify(spec, null, 2), 'application/json');
      expect(response.status()).toBe(ApiConstants.OK);
    });

    await allureStep('Assert spec has required OpenAPI fields', async () => {
      expect(spec!).toHaveProperty('openapi');
      expect(spec!).toHaveProperty('info');
      expect(spec!).toHaveProperty('paths');
    });

    await allureStep('Assert all health endpoints are documented', async () => {
      const paths = Object.keys(spec!.paths as object);
      expect(paths).toContain('/health');
      expect(paths).toContain('/health/ui');
      expect(paths).toContain('/health/api');
      expect(paths).toContain('/health/self');
    });
  });
});
