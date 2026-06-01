import { test, expect } from '../../src/fixtures';
import { CartPage } from '../../src/pages';
import {
  allureEpic,
  allureFeature,
  allureStory,
  allureSeverity,
  allureStep,
} from '../../src/utils/allure';
import { Products, JiraLinks } from '../constants';
import { allureRequirement, allureBug } from '../../src/utils/allure';

const PRODUCT_A = Products.BACKPACK;
const PRODUCT_B = Products.BIKE_LIGHT;

test.describe('Cart', { tag: '@ui' }, () => {
  test(
    'add 2 distinct products — cart badge count and cart contents are correct',
    async ({ authenticatedInventory, page }) => {
      await allureEpic('Shopping');
      await allureFeature('Cart');
      await allureStory('Add multiple products');
      await allureSeverity('critical');
      await allureRequirement(JiraLinks.requirements.CART, 'PROJ-102 — Cart requirement');
      await allureBug(JiraLinks.bugs.CART_BADGE, 'BUG-12 — Cart badge counter');

      const inventory = authenticatedInventory;
      const cart = new CartPage(page);

      await allureStep(`Add "${PRODUCT_A}" to cart and verify badge shows 1`, async () => {
        await inventory.addToCart(PRODUCT_A);
        await inventory.expectCartBadge(1);
      });

      await allureStep(`Add "${PRODUCT_B}" to cart and verify badge shows 2`, async () => {
        await inventory.addToCart(PRODUCT_B);
        await inventory.expectCartBadge(2);
      });

      await allureStep('Navigate to cart page', async () => {
        await inventory.goToCart();
        await cart.expectOnCartPage();
      });

      await allureStep('Verify cart contains exactly 2 items', async () => {
        await cart.expectItemCount(2);
      });

      await allureStep(`Verify "${PRODUCT_A}" and "${PRODUCT_B}" are listed in cart`, async () => {
        await cart.expectItemPresent(PRODUCT_A);
        await cart.expectItemPresent(PRODUCT_B);
      });

      await allureStep('Verify all cart item prices are formatted as $X.XX', async () => {
        const prices = await cart.getCartItemPrices();
        for (const price of prices) {
          expect(price).toMatch(/^\$\d+\.\d{2}$/);
        }
      });
    },
  );

  test(
    'bonus — cart badge increments and decrements as items are added/removed',
    async ({ authenticatedInventory }) => {
      await allureEpic('Shopping');
      await allureFeature('Cart');
      await allureStory('Badge counter updates');
      await allureSeverity('normal');
      await allureRequirement(JiraLinks.requirements.CART, 'PROJ-102 — Cart requirement');
      await allureBug(JiraLinks.bugs.CART_BADGE, 'BUG-12 — Cart badge counter');

      const inventory = authenticatedInventory;

      await allureStep('Verify cart badge is absent before any item is added', async () => {
        await inventory.expectCartBadgeAbsent();
      });

      await allureStep(`Add "${PRODUCT_A}" — badge should show 1`, async () => {
        await inventory.addToCart(PRODUCT_A);
        await inventory.expectCartBadge(1);
      });

      await allureStep(`Add "${PRODUCT_B}" — badge should show 2`, async () => {
        await inventory.addToCart(PRODUCT_B);
        await inventory.expectCartBadge(2);
      });

      await allureStep(`Remove "${PRODUCT_A}" — badge should drop back to 1`, async () => {
        await inventory.removeFromCart(PRODUCT_A);
        await inventory.expectCartBadge(1);
      });

      await allureStep(`Remove "${PRODUCT_B}" — badge should disappear entirely`, async () => {
        await inventory.removeFromCart(PRODUCT_B);
        await inventory.expectCartBadgeAbsent();
      });
    },
  );
});
