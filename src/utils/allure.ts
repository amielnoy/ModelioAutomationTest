/**
 * Allure 3 annotation helpers — thin wrappers over allure-js-commons.
 *
 * Why wrap instead of calling allure-js-commons directly in tests?
 * – One import path in tests; swap the underlying library without touching specs.
 * – Type-safe label names enforced at the call site.
 * – If Allure is removed, delete this file and update the one import.
 */

import {
  label,
  link,
  epic,
  feature,
  story,
  severity,
  step as allureJsStep,
  attachment,
  description,
  owner,
} from 'allure-js-commons';
import { test } from '@playwright/test';
import { logger } from './logger';

export type Severity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';

/** Tag a test with an Allure severity level. */
export const allureSeverity = (s: Severity) => severity(s);

/** Tag a test to an epic (top-level feature grouping). */
export const allureEpic = (name: string) => epic(name);

/** Tag a test to a feature within an epic. */
export const allureFeature = (name: string) => feature(name);

/** Tag a test to a user story. */
export const allureStory = (name: string) => story(name);

/** Attach text or binary content to the Allure result. */
export const allureAttachment = (
  name: string,
  content: string | Buffer,
  type: string = 'text/plain',
) => attachment(name, content as string, { contentType: type });

/**
 * Unified step wrapper: Playwright test.step (trace) + Allure step (report) + logger.
 *
 * Usage:
 *   await allureStep('Add backpack to cart', async () => {
 *     await inventory.addToCart('Sauce Labs Backpack');
 *   });
 */
export const allureStep = <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  logger.step(`▶ ${name}`);
  return test.step(name, () =>
    Promise.resolve(allureJsStep(name, fn))
      .then(result => { logger.pass(`✓ ${name}`); return result; })
      .catch(err   => { logger.fail(`✗ ${name}`, err); throw err; }),
  );
};

/** Add a free-text description to the test result. */
export const allureDescription = (text: string) => description(text);

/** Record the owner of a test (team or person). */
export const allureOwner = (name: string) => owner(name);

/** Add an arbitrary custom label. */
export const allureLabel = (name: string, value: string) => label(name, value);

/** Link a test to an external URL (e.g. Jira ticket, test case management). */
export const allureLink = (url: string, name?: string, type?: string) =>
  link(url, name, type);
