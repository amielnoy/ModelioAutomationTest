import { test, expect } from '../../src/fixtures';
import { allureEpic, allureFeature, allureStory, allureSeverity, allureStep, allureRequirement } from '../../src/utils/allure';
import { JiraLinks } from '../constants';
import loginParams from '../data/login.params.json';

type LoginParam = (typeof loginParams)[number];

test.describe('Login — data-driven', { tag: '@ui' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  for (const params of loginParams as LoginParam[]) {
    test(`${params.scenario}`, async ({ loginPage, page }) => {
      await allureEpic('Authentication');
      await allureFeature('Login');
      await allureStory(params.scenario);
      await allureSeverity(params.expectedResult === 'success' ? 'blocker' : 'normal');
      await allureRequirement(JiraLinks.requirements.LOGIN, 'PROJ-101 — Login requirement');

      await allureStep(`Fill credentials: "${params.username}" / "${params.password}"`, async () => {
        await loginPage.login(params.username, params.password);
      });

      if (params.expectedResult === 'success') {
        await allureStep(`Assert redirect to ${params.expectedUrl}`, async () => {
          await expect(page).toHaveURL(new RegExp(params.expectedUrl ?? '/inventory'));
        });
      } else {
        await allureStep(`Assert error message: "${params.expectedError}"`, async () => {
          await loginPage.expectErrorContaining(params.expectedError ?? '');
        });

        await allureStep('Assert user remains on login page', async () => {
          await loginPage.expectOnLoginPage();
        });
      }
    });
  }
});
