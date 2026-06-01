import { test as setup } from '@playwright/test';
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

  await page.context().storageState({ path: STORAGE_STATE });
});
