import { test, expect } from '../../src/fixtures';
import { config } from '../../src/utils/config';
import {
  allureEpic,
  allureFeature,
  allureStory,
  allureSeverity,
  allureStep,
} from '../../src/utils/allure';

/**
 * Login tests — Part 1, scenarios 1 & 2.
 *
 * Each test is fully independent:
 * – No shared state: every test gets a fresh browser context (Playwright default).
 * – No sleeps: Playwright auto-waits on every action; explicit waits in page objects
 *   use condition-based locator.waitFor().
 * – Selectors: data-test attributes only (getByTestId).
 */

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test(
    'happy path — standard_user lands on inventory with items visible',
    async ({ loginPage, inventoryPage }) => {
      await allureEpic('Authentication');
      await allureFeature('Login');
      await allureStory('Happy path login');
      await allureSeverity('blocker');

      await allureStep('Log in as standard_user', async () => {
        await loginPage.login(
          config.web.credentials.standard.username,
          config.web.credentials.standard.password,
        );
      });

      await allureStep('Verify inventory page is shown with items', async () => {
        await inventoryPage.expectOnInventoryPage();
        await inventoryPage.expectInventoryVisible();
      });
    },
  );

  test(
    'invalid credentials — visible error message shown, wording is asserted exactly',
    async ({ loginPage }) => {
      await allureEpic('Authentication');
      await allureFeature('Login');
      await allureStory('Invalid credentials');
      await allureSeverity('critical');

      await allureStep('Attempt login with wrong password', async () => {
        await loginPage.login('standard_user', 'wrong_password');
      });

      await allureStep('Verify exact error message is displayed', async () => {
        /**
         * The assignment says: "Test must fail loudly if the message wording changes."
         * We assert the EXACT string the app shows. If Swag Labs ever changes the copy,
         * this test breaks visibly — which is the desired behaviour.
         */
        await loginPage.expectErrorContaining(
          'Epic sadface: Username and password do not match any user in this service',
        );
      });

      await allureStep('Verify user remains on login page', async () => {
        await loginPage.expectOnLoginPage();
      });
    },
  );

  test(
    '[INTENTIONAL FAIL] dashboard shows welcome banner after login',
    async ({ page, loginPage, inventoryPage }) => {
      await allureEpic('Authentication');
      await allureFeature('Login');
      await allureStory('Welcome banner');
      await allureSeverity('minor');

      await allureStep('Log in as standard_user', async () => {
        await loginPage.login(
          config.web.credentials.standard.username,
          config.web.credentials.standard.password,
        );
      });

      await allureStep('Verify welcome banner is visible', async () => {
        await inventoryPage.expectOnInventoryPage();
        // SauceDemo has no welcome banner — this assertion is intentionally wrong
        await expect(page.getByTestId('welcome-banner')).toBeVisible({ timeout: 3000 });
      });
    },
  );
});
