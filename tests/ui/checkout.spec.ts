import { test, expect } from '../../src/fixtures';
import { CartPage, CheckoutPage } from '../../src/pages';
import {
  allureEpic,
  allureFeature,
  allureStory,
  allureSeverity,
  allureStep,
} from '../../src/utils/allure';
import { Products, SortOptions, CustomerInfo, JiraLinks } from '../constants';
import { allureRequirement, allueBug } from '../../src/utils/allure';

const PRODUCT = Products.BACKPACK;

test.describe('Checkout', { tag: '@ui' }, () => {
  test(
    'end-to-end checkout — add product → info → overview → order confirmed',
    async ({ authenticatedInventory, page }) => {
      await allureEpic('Shopping');
      await allureFeature('Checkout');
      await allureStory('End-to-end purchase flow');
      await allureSeverity('blocker');
      await allureRequirement(JiraLinks.requirements.CHECKOUT, 'PROJ-103 — Checkout requirement');
      await allueBug(JiraLinks.bugs.CHECKOUT_FLOW, 'BUG-13 — Checkout flow');

      const inventory = authenticatedInventory;
      const cart      = new CartPage(page);
      const checkout  = new CheckoutPage(page);

      await allureStep(`Add "${PRODUCT}" to cart and verify badge shows 1`, async () => {
        await inventory.addToCart(PRODUCT);
        await inventory.expectCartBadge(1);
      });

      await allureStep('Navigate to cart and confirm product is listed', async () => {
        await inventory.goToCart();
        await cart.expectOnCartPage();
        await cart.expectItemPresent(PRODUCT);
      });

      await allureStep('Proceed to checkout — verify Step 1 (customer info) is shown', async () => {
        await cart.proceedToCheckout();
        await checkout.expectOnStepOne();
      });

      await allureStep('Fill in customer information (first name, last name, postal code)', async () => {
        await checkout.fillCustomerInfo(CustomerInfo);
      });

      await allureStep('Continue to Step 2 — verify order overview is displayed', async () => {
        await checkout.expectOnStepTwo();
      });

      await allureStep('Finish order and confirm success message is shown', async () => {
        await checkout.finish();
        await checkout.expectOrderComplete();
      });
    },
  );
});

test.describe('Product sorting (bonus)', { tag: '@ui' }, () => {
  test(
    'sort price low-to-high — prices are in ascending order',
    async ({ authenticatedInventory }) => {
      await allureEpic('Shopping');
      await allureFeature('Inventory');
      await allureStory('Product sorting');
      await allureSeverity('normal');
      await allureRequirement(JiraLinks.requirements.CHECKOUT, 'PROJ-103 — Checkout requirement');

      const inventory = authenticatedInventory;

      await allureStep('Apply "Price (low to high)" sort option', async () => {
        await inventory.sortBy(SortOptions.PRICE_LOW_TO_HIGH);
      });

      await allureStep('Verify all displayed prices are in ascending order', async () => {
        const prices = await inventory.getProductPrices();
        expect(prices.length).toBeGreaterThan(0);
        for (let i = 0; i < prices.length - 1; i++) {
          expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
        }
      });
    },
  );

  test(
    'sort price high-to-low — prices are in descending order',
    async ({ authenticatedInventory }) => {
      await allureEpic('Shopping');
      await allureFeature('Inventory');
      await allureStory('Product sorting');
      await allureSeverity('normal');

      const inventory = authenticatedInventory;

      await allureStep('Apply "Price (high to low)" sort option', async () => {
        await inventory.sortBy(SortOptions.PRICE_HIGH_TO_LOW);
      });

      await allureStep('Verify all displayed prices are in descending order', async () => {
        const prices = await inventory.getProductPrices();
        expect(prices.length).toBeGreaterThan(0);
        for (let i = 0; i < prices.length - 1; i++) {
          expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
        }
      });
    },
  );
});
