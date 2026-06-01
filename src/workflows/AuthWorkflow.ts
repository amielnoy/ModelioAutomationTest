import { Page } from '@playwright/test';
import { LoginPage, InventoryPage } from '../pages';

export class AuthWorkflow {
  private loginPage: LoginPage;
  private inventoryPage: InventoryPage;

  constructor(private readonly page: Page) {
    this.loginPage = new LoginPage(page);
    this.inventoryPage = new InventoryPage(page);
  }

  async login(username: string, password: string): Promise<InventoryPage> {
    await this.loginPage.navigate();
    await this.loginPage.login(username, password);
    await this.inventoryPage.expectOnInventoryPage();
    return this.inventoryPage;
  }
}
