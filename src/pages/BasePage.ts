import { Page, Locator } from '@playwright/test';

/**
 * BasePage — shared navigation helpers and wait utilities.
 * All page objects extend this class. Zero test logic lives here.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to a path relative to baseURL. */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait until a locator is visible. Playwright's built-in auto-wait handles
   * most cases; this is a deliberate explicit guard for post-navigation checks.
   */
  async waitForVisible(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
  }

  /** Current page URL. */
  get url(): string {
    return this.page.url();
  }

  get title(): Promise<string> {
    return this.page.title();
  }
}
