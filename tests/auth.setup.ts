import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { LoginPage } from '../src/pages';
import { config } from '../src/utils/config';

export const STORAGE_STATE = path.join(__dirname, '../.auth/user.json');

setup('authenticate as standard_user', async ({ page }) => {
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(
    config.web.credentials.standard.username,
    config.web.credentials.standard.password,
  );

  // Verify login succeeded before persisting session — a failed login would
  // silently write a session pointing at the login page, breaking all UI tests.
  await expect(page).toHaveURL(/inventory/);

  await page.context().storageState({ path: STORAGE_STATE });
});
