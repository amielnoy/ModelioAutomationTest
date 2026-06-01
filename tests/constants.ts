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
