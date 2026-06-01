import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/**
 * CheckoutPage — covers Step One (/checkout-step-one.html),
 * Step Two (/checkout-step-two.html), and Complete (/checkout-complete.html).
 * All three steps share this object; the current step determines which
 * locators are active.
 */
export class CheckoutPage extends BasePage {
  // ── Step One ──────────────────────────────────────────────────────────────
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;

  // ── Step Two ──────────────────────────────────────────────────────────────
  readonly summaryItems: Locator;
  readonly summaryTotal: Locator;
  readonly finishButton: Locator;

  // ── Complete ─────────────────────────────────────────────────────────────
  readonly confirmationHeader: Locator;
  readonly confirmationText: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    // Step One
    this.firstNameInput  = page.getByTestId('firstName');
    this.lastNameInput   = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton  = page.getByRole('button', { name: 'Continue' });
    // Step Two
    this.summaryItems  = page.getByTestId('inventory-item');
    this.summaryTotal  = page.getByTestId('total-label');
    this.finishButton  = page.getByRole('button', { name: 'Finish' });
    // Complete
    this.confirmationHeader = page.getByTestId('complete-header');
    this.confirmationText   = page.getByTestId('complete-text');
    this.backHomeButton     = page.getByRole('button', { name: 'Back Home' });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async fillCustomerInfo(info: CustomerInfo): Promise<void> {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.postalCodeInput.fill(info.postalCode);
    await this.continueButton.click();
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async expectOnStepOne(): Promise<void> {
    await expect(this.firstNameInput).toBeVisible();
  }

  async expectOnStepTwo(): Promise<void> {
    await expect(this.finishButton).toBeVisible();
  }

  async expectOrderComplete(): Promise<void> {
    await expect(this.confirmationHeader).toBeVisible();
    await expect(this.confirmationHeader).toHaveText('Thank you for your order!');
  }
}
