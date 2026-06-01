import { test, expect } from '../../src/fixtures';
import { CartPage, CheckoutPage } from '../../src/pages';
import {
  allureEpic,
  allureFeature,
  allureStory,
  allureSeverity,
  allureStep,
} from '../../src/utils/allure';

/**
 * Checkout tests — Part 1, scenario 4 + bonus product sorting.
 */

const PRODUCT = 'Sauce Labs Backpack';

test.describe('Checkout', () => {
  test(
    'end-to-end checkout — add product → info → overview → order confirmed',
    async ({ authenticatedInventory, page }) => {
      await allureEpic('Shopping');
      await allureFeature('Checkout');
      await allureStory('End-to-end purchase flow');
      await allureSeverity('blocker');

      const inventory = authenticatedInventory;
      const cart      = new CartPage(page);
      const checkout  = new CheckoutPage(page);

      // Add one product to cart.
      await inventory.addToCart(PRODUCT);
      await inventory.expectCartBadge(1);
      await inventory.goToCart();

      // Verify cart contents before proceeding.
      await cart.expectOnCartPage();
      await cart.expectItemPresent(PRODUCT);

      // Step 1: proceed to checkout.
      await cart.proceedToCheckout();
      await checkout.expectOnStepOne();

      // Fill in customer information.
      await checkout.fillCustomerInfo({
        firstName: 'Test',
        lastName: 'User',
        postalCode: '12345',
      });

      // Step 2: verify overview page.
      await checkout.expectOnStepTwo();

      // Finish the order.
      await checkout.finish();

      // Assert completion confirmation.
      await checkout.expectOrderComplete();
    },
  );
});

// ── Bonus: product sorting ─────────────────────────────────────────────────

test.describe('Product sorting (bonus)', () => {
  test(
    'sort price low-to-high — prices are in ascending order',
    async ({ authenticatedInventory }) => {
      const inventory = authenticatedInventory;

      await inventory.sortBy('lohi');

      const prices = await inventory.getProductPrices();
      expect(prices.length).toBeGreaterThan(0);

      // Verify each price is ≤ the next.
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
      }
    },
  );

  test(
    'sort price high-to-low — prices are in descending order',
    async ({ authenticatedInventory }) => {
      const inventory = authenticatedInventory;

      await inventory.sortBy('hilo');

      const prices = await inventory.getProductPrices();
      expect(prices.length).toBeGreaterThan(0);

      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
      }
    },
  );
});
