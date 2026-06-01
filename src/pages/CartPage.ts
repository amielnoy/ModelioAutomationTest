import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CartItem } from './components/CartItem';

/**
 * CartPage — /cart.html
 */
export class CartPage extends BasePage {
  readonly pageTitle: Locator;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    // Title element in Sauce Demo uses a non-semantic element with test id 'title'.
    this.pageTitle = page.getByTestId('title');
    // Use structural class selectors which are stable in Sauce Demo markup.
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Locator for a specific cart item by product name. */
  cartItemByName(name: string): Locator {
    return this.page.locator('.cart_item').filter({ hasText: name });
  }

  /** Returns a `CartItem` component for the named product. */
  cartItemComponentByName(name: string): CartItem {
    const root = this.cartItemByName(name);
    return new CartItem(root);
  }

  async getCartItemNames(): Promise<string[]> {
    return this.page.locator('.cart_item .inventory_item_name').allTextContents();
  }

  async getCartItemPrices(): Promise<string[]> {
    return this.page.locator('.cart_item .inventory_item_price').allTextContents();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async expectOnCartPage(): Promise<void> {
    await expect(this.pageTitle).toHaveText('Your Cart');
  }

  async expectItemCount(count: number): Promise<void> {
    await expect(this.cartItems).toHaveCount(count);
  }

  async expectItemPresent(name: string): Promise<void> {
    await expect(this.cartItemByName(name)).toBeVisible();
  }

  async expectItemWithPrice(name: string, price: string): Promise<void> {
    const item = this.cartItemComponentByName(name);
    await expect(item.price()).toHaveText(price);
  }
}
