import { Page } from '@playwright/test';
import { CartPage, CheckoutPage } from '../pages';

export class CheckoutWorkflow {
  private cart: CartPage;
  private checkout: CheckoutPage;

  constructor(private readonly page: Page) {
    this.cart = new CartPage(page);
    this.checkout = new CheckoutPage(page);
  }

  async proceedToCheckout(): Promise<CheckoutPage> {
    await this.cart.proceedToCheckout();
    await this.checkout.expectOnStepOne();
    return this.checkout;
  }

  async completeCheckout(info: { firstName: string; lastName: string; postalCode: string; }) {
    await this.checkout.fillCustomerInfo(info);
    await this.checkout.expectOnStepTwo();
    await this.checkout.finish();
    await this.checkout.expectOrderComplete();
  }
}
