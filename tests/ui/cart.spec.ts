import { test, expect } from '../../src/fixtures';
import { CartPage } from '../../src/pages';
import {
  allureEpic,
  allureFeature,
  allureStory,
  allureSeverity,
  allureStep,
} from '../../src/utils/allure';

/**
 * Cart tests — Part 1, scenario 3 + bonus badge updates.
 *
 * Uses `authenticatedInventory` fixture so the test body focuses
 * on its scenario, not login ceremony.
 */

// Products under test — using data-test-safe names.
const PRODUCT_A = 'Sauce Labs Backpack';
const PRODUCT_B = 'Sauce Labs Bike Light';

test.describe('Cart', () => {
  test(
    'add 2 distinct products — cart badge count and cart contents are correct',
    async ({ authenticatedInventory, page }) => {
      await allureEpic('Shopping');
      await allureFeature('Cart');
      await allureStory('Add multiple products');
      await allureSeverity('critical');

      const inventory = authenticatedInventory;
      const cart = new CartPage(page);

      // Add first product and verify badge increments.
      await inventory.addToCart(PRODUCT_A);
      await inventory.expectCartBadge(1);

      // Add second product and verify badge increments again.
      await inventory.addToCart(PRODUCT_B);
      await inventory.expectCartBadge(2);

      // Navigate to cart.
      await inventory.goToCart();
      await cart.expectOnCartPage();

      // Assert item count.
      await cart.expectItemCount(2);

      // Assert both products are present by name.
      await cart.expectItemPresent(PRODUCT_A);
      await cart.expectItemPresent(PRODUCT_B);

      // Assert prices are present (non-empty, starts with $).
      const prices = await cart.getCartItemPrices();
      for (const price of prices) {
        expect(price).toMatch(/^\$\d+\.\d{2}$/);
      }
    },
  );

  // ── Bonus: badge updates on add/remove ────────────────────────────────────
  test(
    'bonus — cart badge increments and decrements as items are added/removed',
    async ({ authenticatedInventory }) => {
      await allureEpic('Shopping');
      await allureFeature('Cart');
      await allureStory('Badge counter updates');
      await allureSeverity('normal');

      const inventory = authenticatedInventory;

      // Start: no badge visible.
      await inventory.expectCartBadgeAbsent();

      // Add → badge = 1.
      await inventory.addToCart(PRODUCT_A);
      await inventory.expectCartBadge(1);

      // Add another → badge = 2.
      await inventory.addToCart(PRODUCT_B);
      await inventory.expectCartBadge(2);

      // Remove one → badge = 1.
      await inventory.removeFromCart(PRODUCT_A);
      await inventory.expectCartBadge(1);

      // Remove last → badge disappears.
      await inventory.removeFromCart(PRODUCT_B);
      await inventory.expectCartBadgeAbsent();
    },
  );
});
