import { Page } from '@playwright/test';
import { InventoryPage, CartPage } from '../pages';

export class CartWorkflow {
  private inventory: InventoryPage;
  private cart: CartPage;

  constructor(private readonly page: Page) {
    this.inventory = new InventoryPage(page);
    this.cart = new CartPage(page);
  }

  async addProduct(name: string): Promise<void> {
    await this.inventory.addToCart(name);
  }

  async addProducts(names: string[]): Promise<void> {
    for (const n of names) await this.addProduct(n);
  }

  async goToCart(): Promise<CartPage> {
    await this.inventory.goToCart();
    await this.cart.expectOnCartPage();
    return this.cart;
  }
}
