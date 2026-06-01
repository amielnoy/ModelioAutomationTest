import * as fs from 'fs';
import { test as authTest } from './auth';
import { allureAttachment, allureLink } from '../utils/allure';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export type AutoFixtures = {
  _failureCapture: void;
  _serverLinks: void;
};

export const test = authTest.extend<AutoFixtures>({
  _serverLinks: [async ({}, use) => {
    await allureLink(config.health.allureReportUrl, 'Allure Report', 'tms');
    if (!process.env.CI) {
      await allureLink(`${config.health.apiUrl}/docs`, 'Swagger UI', 'tms');
      await allureLink(config.health.apiUrl,           'FastAPI',    'tms');
      await allureLink(config.health.grafanaUrl,       'Grafana',    'tms');
    }
    await use(undefined as unknown as void);
  }, { auto: true }],

  _failureCapture: [async ({ page }, use, testInfo) => {
    await use(undefined as unknown as void);

    if (testInfo.status === testInfo.expectedStatus) return;

    const title = testInfo.title;
    const isUiTest = testInfo.project?.name === 'chromium';
    logger.fail(`Test "${title}"`, testInfo.errors[0]?.message);

    if (isUiTest) {
      try {
        const screenshot = await page.screenshot({ fullPage: true });
        await testInfo.attach('failure-screenshot', { body: screenshot, contentType: 'image/png' });
        await allureAttachment('Last screenshot', screenshot, 'image/png');
        logger.info(`  Screenshot captured`);
      } catch {
        logger.warn(`  Screenshot unavailable (page already closed)`);
      }

      try {
        const videoPath = await page.video()?.path();
        if (videoPath && fs.existsSync(videoPath)) {
          await allureAttachment('Failure video', fs.readFileSync(videoPath), 'video/webm' as never);
          logger.info(`  Video: ${videoPath}`);
        }
      } catch {
        logger.warn(`  Video unavailable`);
      }
    }

    const traceAttachment = testInfo.attachments.find(a => a.name === 'trace');
    if (traceAttachment?.path && fs.existsSync(traceAttachment.path)) {
      await allureAttachment('Trace', fs.readFileSync(traceAttachment.path), 'application/zip');
      logger.info(`  Trace: ${traceAttachment.path}`);
    }
  }, { auto: true }],
});
