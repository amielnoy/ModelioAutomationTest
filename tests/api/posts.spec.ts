import { test, expect } from '../../src/fixtures';
import { ApiConstants } from '../../src/api/ApiConstants';
import { Post } from '../../src/types/api.types';
import {
  allureEpic,
  allureFeature,
  allureStory,
  allureSeverity,
  allureAttachment,
} from '../../src/utils/allure';

/**
 * JSONPlaceholder /posts API tests — Part 2.
 *
 * No execution-order dependency: every test operates on its own data.
 * Writes (POST/PUT/DELETE) are simulated — we assert response shape, not persistence.
 *
 * Schema assertions use expect().toMatchObject() to guard against drift:
 * if the API removes a required field, tests fail loudly.
 */

test.describe('GET /posts', () => {
  test('returns 200 with a non-empty JSON array matching Post schema', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('GET all posts');
    await allureSeverity('critical');

    const response = await postsApi.getAll();

    expect(response.status()).toBe(ApiConstants.OK);

    const body: Post[] = await response.json();
    await allureAttachment('Response body (sample)', JSON.stringify(body.slice(0, 3), null, 2), 'application/json');

    // Is it an array?
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    // Sample the first item for schema compliance.
    expect(body[0]).toMatchObject({
      userId: expect.any(Number),
      id: expect.any(Number),
      title: expect.any(String),
      body: expect.any(String),
    });
  });
});

test.describe('GET /posts/{id}', () => {
  test('returns 200 and correct body for a valid id', async ({ postsApi }) => {
    const { response, body } = await postsApi.getByIdAs(1);

    expect(response.status()).toBe(ApiConstants.OK);
    expect(body).toMatchObject({
      userId: expect.any(Number),
      id: 1,
      title: expect.any(String),
      body: expect.any(String),
    });
  });

  test('returns 404 for a non-existent id', async ({ postsApi }) => {
    const response = await postsApi.getById(99999);
    expect(response.status()).toBe(ApiConstants.NOT_FOUND);
  });
});

test.describe('POST /posts', () => {
  test('returns 201 Created, echoes payload, and includes a generated id', async ({ postsApi }) => {
    const payload = {
      userId: 1,
      title: 'Test post title',
      body: 'Test post body content',
    };

    const response = await postsApi.create(payload);
    expect(response.status()).toBe(ApiConstants.CREATED);

    const body: Post = await response.json();

    // Response echoes the payload fields we sent.
    expect(body).toMatchObject({
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
    });

    // JSONPlaceholder generates a numeric id (typically 101 for new posts).
    expect(typeof body.id).toBe('number');
    expect(body.id).toBeGreaterThan(0);
  });
});

test.describe('PUT /posts/{id} and DELETE /posts/{id}', () => {
  test('PUT returns 200 with the updated body reflected in response', async ({ postsApi }) => {
    const updated = {
      userId: 1,
      title: 'Updated title',
      body: 'Updated body content',
    };

    const response = await postsApi.update(1, updated);
    expect(response.status()).toBe(ApiConstants.OK);

    const body = await response.json();
    expect(body).toMatchObject({
      id: 1,
      title: updated.title,
      body: updated.body,
    });
  });

  test('DELETE returns 200 or 204 with empty/nullish body', async ({ postsApi }) => {
    const response = await postsApi.remove(1);

    // JSONPlaceholder returns 200 {}; some REST standards return 204.
    expect([ApiConstants.OK, ApiConstants.NO_CONTENT]).toContain(response.status());

    if (response.status() === ApiConstants.OK) {
      const body = await response.json();
      // Body should be empty object (simulated delete).
      expect(body).toEqual({});
    }
  });
});
