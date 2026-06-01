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
  step,
  attachment,
  description,
  owner,
} from 'allure-js-commons';

export type Severity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';

/** Tag a test with an Allure severity level. */
export const allureSeverity = (s: Severity) => severity(s);

/** Tag a test to an epic (top-level feature grouping). */
export const allureEpic = (name: string) => epic(name);

/** Tag a test to a feature within an epic. */
export const allureFeature = (name: string) => feature(name);

/** Tag a test to a user story. */
export const allureStory = (name: string) => story(name);

/** Attach arbitrary text content to the Allure result (e.g. API response body). */
export const allureAttachment = (
  name: string,
  content: string,
  type: 'text/plain' | 'application/json' | 'text/html' = 'text/plain',
) => attachment(name, content, { contentType: type });

/**
 * Wrap a block of test code in a named Allure step.
 * Steps appear as a collapsible timeline in the Allure report.
 *
 * Usage:
 *   await allureStep('Add backpack to cart', async () => {
 *     await inventory.addToCart('Sauce Labs Backpack');
 *   });
 */
export const allureStep = <T>(name: string, fn: () => Promise<T>): Promise<T> =>
  Promise.resolve(step(name, fn));

/** Add a free-text description to the test result. */
export const allureDescription = (text: string) => description(text);

/** Record the owner of a test (team or person). */
export const allureOwner = (name: string) => owner(name);

/** Add an arbitrary custom label. */
export const allureLabel = (name: string, value: string) => label(name, value);

/** Link a test to an external URL (e.g. Jira ticket, test case management). */
export const allureLink = (url: string, name?: string, type?: string) =>
  link(url, name, type);
