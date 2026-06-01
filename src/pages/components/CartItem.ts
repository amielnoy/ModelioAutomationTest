import { Locator } from '@playwright/test';

/**
 * CartItem — subpage object representing a single cart row
 */
export class CartItem {
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

  async remove(): Promise<void> {
    await this.root.getByRole('button', { name: 'Remove' }).click();
  }
}
