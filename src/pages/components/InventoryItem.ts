import { Locator } from '@playwright/test';

/**
 * InventoryItem — subpage object representing a single product row
 */
export class InventoryItem {
  readonly root: Locator;

  constructor(root: Locator) {
    this.root = root;
  }

  name(): Locator {
    return this.root.locator('.inventory_item_name');
  }

  price(): Locator {
    return this.root.locator('.inventory_item_price');
  }

  async addToCart(): Promise<void> {
    await this.root.getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromCart(): Promise<void> {
    await this.root.getByRole('button', { name: 'Remove' }).click();
  }
}
