export { test } from './auto';
export { expect } from '@playwright/test';
export type { Pages } from './pages';
export type { ApiFixtures } from './api';
export type { WorkflowFixtures, AuthFixtures } from './auth';
export type { AutoFixtures } from './auto';

import type { Pages } from './pages';
import type { ApiFixtures } from './api';
import type { WorkflowFixtures, AuthFixtures } from './auth';
import type { AutoFixtures } from './auto';

export type AppFixtures = Pages & ApiFixtures & AuthFixtures & WorkflowFixtures & AutoFixtures;
