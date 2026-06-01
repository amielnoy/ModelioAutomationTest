import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { InventoryItem } from './components/InventoryItem';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * InventoryPage — /inventory.html
 * Covers product listing, sorting, and add/remove cart interactions.
 */
export class InventoryPage extends BasePage {
  // ── Locators ──────────────────────────────────────────────────────────────
  readonly pageTitle: Locator;
  readonly inventoryList: Locator;
  readonly cartBadge: Locator;
  readonly cartIcon: Locator;
  readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    // Title element uses a non-semantic element with test id 'title'. Use data-test for stability.
    this.pageTitle = page.getByTestId('title');
    this.inventoryList = page.getByTestId('inventory-list');
    this.cartBadge     = page.getByTestId('shopping-cart-badge');
    this.cartIcon      = page.getByTestId('shopping-cart-link');
    this.sortDropdown  = page.getByTestId('product-sort-container');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Returns the "Add to cart" button for the named product. */
  addToCartButton(productName: string): Locator {
    // data-test="add-to-cart-sauce-labs-backpack" etc. — built from name.
    const testId = `add-to-cart-${productName.toLowerCase().replace(/\s+/g, '-')}`;
    return this.page.getByTestId(testId);
  }

  /** Returns the "Remove" button for the named product. */
  removeButton(productName: string): Locator {
    const testId = `remove-${productName.toLowerCase().replace(/\s+/g, '-')}`;
    return this.page.getByTestId(testId);
  }

  /** Returns an `InventoryItem` component for the named product. */
  inventoryItemByName(productName: string): InventoryItem {
    const root = this.page.getByTestId('inventory-item').filter({ hasText: productName });
    return new InventoryItem(root);
  }

  async addToCart(productName: string): Promise<void> {
    // Prefer the subpage object's scoped button where possible.
    const item = this.inventoryItemByName(productName);
    await item.addToCart();
  }

  async removeFromCart(productName: string): Promise<void> {
    const item = this.inventoryItemByName(productName);
    await item.removeFromCart();
  }

  async goToCart(): Promise<void> {
    await this.cartIcon.click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  /** Returns an array of visible product prices in order. */
  async getProductPrices(): Promise<number[]> {
    const priceLocators = this.page.getByTestId('inventory-item-price');
    const texts = await priceLocators.allTextContents();
    return texts.map(t => parseFloat(t.replace('$', '')));
  }

  /** Returns an array of visible product names in order. */
  async getProductNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async expectOnInventoryPage(): Promise<void> {
    await expect(this.inventoryList).toBeVisible();
    await expect(this.pageTitle).toHaveText('Products');
  }

  async expectCartBadge(count: number): Promise<void> {
    await expect(this.cartBadge).toHaveText(String(count));
  }

  async expectCartBadgeAbsent(): Promise<void> {
    await expect(this.cartBadge).not.toBeVisible();
  }

  async expectInventoryVisible(): Promise<void> {
    const items = this.page.getByTestId('inventory-item');
    await expect(items.first()).toBeVisible();
  }
}
