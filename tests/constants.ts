export const Products = {
  BACKPACK:   'Sauce Labs Backpack',
  BIKE_LIGHT: 'Sauce Labs Bike Light',
} as const;

export const SortOptions = {
  PRICE_LOW_TO_HIGH:  'lohi',
  PRICE_HIGH_TO_LOW:  'hilo',
} as const;

export const CustomerInfo = {
  firstName:  'Test',
  lastName:   'User',
  postalCode: '12345',
} as const;

export const LoginMessages = {
  INVALID_CREDENTIALS: 'Epic sadface: Username and password do not match any user in this service',
} as const;

export const InvalidCredentials = {
  username: 'standard_user',
  password: 'wrong_password',
} as const;

/** Base URL for example Jira project — replace with your actual instance. */
const JIRA = 'https://your-org.atlassian.net/browse';

export const JiraLinks = {
  requirements: {
    LOGIN:    `${JIRA}/PROJ-101`,
    CART:     `${JIRA}/PROJ-102`,
    CHECKOUT: `${JIRA}/PROJ-103`,
    POSTS:    `${JIRA}/PROJ-104`,
    HEALTH:   `${JIRA}/PROJ-105`,
  },
  bugs: {
    LOGIN_BANNER:  `${JIRA}/BUG-11`,
    CART_BADGE:    `${JIRA}/BUG-12`,
    CHECKOUT_FLOW: `${JIRA}/BUG-13`,
    POSTS_DELETE:  `${JIRA}/BUG-14`,
    HEALTH_DOWN:   `${JIRA}/BUG-15`,
  },
} as const;

export const PostFixtures = {
  VALID_ID:       1,
  NONEXISTENT_ID: 99999,
  CREATE_PAYLOAD: {
    userId: 1,
    title:  'Test post title',
    body:   'Test post body content',
  },
  UPDATE_PAYLOAD: {
    userId: 1,
    title:  'Updated title',
    body:   'Updated body content',
  },
} as const;
