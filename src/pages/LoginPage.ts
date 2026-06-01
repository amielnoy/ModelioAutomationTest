import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage — encapsulates all interactions with /
 * Uses data-test attributes (Swag Labs exposes these everywhere).
 * No locators leak into test files.
 */
export class LoginPage extends BasePage {
  // ── Locators ──────────────────────────────────────────────────────────────
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    // Use role-based selector for the submit control where accessible.
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async navigate(): Promise<void> {
    await this.goto('/');
    await this.waitForVisible(this.loginButton);
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async expectErrorContaining(text: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(text);
  }

  async expectOnLoginPage(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }
}
