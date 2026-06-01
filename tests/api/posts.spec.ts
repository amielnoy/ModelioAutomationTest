import { test, expect } from '../../src/fixtures';
import { ApiConstants } from '../../src/api/ApiConstants';
import { Post } from '../../src/types/api.types';
import {
  allureEpic,
  allureFeature,
  allureStory,
  allureSeverity,
  allureStep,
  allureAttachment,
} from '../../src/utils/allure';
import { APIResponse } from '@playwright/test';

async function attachRequestResponse(
  method: string,
  url: string,
  requestData: unknown,
  response: APIResponse,
): Promise<void> {
  const requestInfo = { method, url, body: requestData ?? null };
  await allureAttachment('Request', JSON.stringify(requestInfo, null, 2), 'application/json');

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(response.headers())) headers[k] = v;
  await allureAttachment('Response headers', JSON.stringify({ status: response.status(), headers }, null, 2), 'application/json');

  const rawBody = await response.text();
  try {
    await allureAttachment('Response payload', JSON.stringify(JSON.parse(rawBody), null, 2), 'application/json');
  } catch {
    await allureAttachment('Response payload', rawBody, 'text/plain');
  }
}

test.describe('GET /posts', () => {
  test('returns 200 with a non-empty JSON array matching Post schema', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('GET all posts');
    await allureSeverity('critical');

    let response!: APIResponse;

    await allureStep('Send GET /posts', async () => {
      response = await postsApi.getAll();
      await attachRequestResponse('GET', '/posts', null, response);
    });

    await allureStep('Assert status 200', async () => {
      expect(response.status()).toBe(ApiConstants.OK);
    });

    await allureStep('Assert non-empty array with valid Post schema', async () => {
      const body: Post[] = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toMatchObject({
        userId: expect.any(Number),
        id: expect.any(Number),
        title: expect.any(String),
        body: expect.any(String),
      });
    });
  });
});

test.describe('GET /posts/{id}', () => {
  test('returns 200 and correct body for a valid id', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('GET single post');
    await allureSeverity('critical');

    let response!: APIResponse;
    let body!: Post;

    await allureStep('Send GET /posts/1', async () => {
      const result = await postsApi.getByIdAs(1);
      response = result.response;
      body = result.body;
      await attachRequestResponse('GET', '/posts/1', null, response);
    });

    await allureStep('Assert status 200 and correct body', async () => {
      expect(response.status()).toBe(ApiConstants.OK);
      expect(body).toMatchObject({
        userId: expect.any(Number),
        id: 1,
        title: expect.any(String),
        body: expect.any(String),
      });
    });
  });

  test('returns 404 for a non-existent id', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('GET non-existent post');
    await allureSeverity('normal');

    let response!: APIResponse;

    await allureStep('Send GET /posts/99999', async () => {
      response = await postsApi.getById(99999);
      await attachRequestResponse('GET', '/posts/99999', null, response);
    });

    await allureStep('Assert status 404', async () => {
      expect(response.status()).toBe(ApiConstants.NOT_FOUND);
    });
  });
});

test.describe('POST /posts', () => {
  test('returns 201 Created, echoes payload, and includes a generated id', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('Create post');
    await allureSeverity('critical');

    const payload = {
      userId: 1,
      title: 'Test post title',
      body: 'Test post body content',
    };

    let response!: APIResponse;
    let body!: Post;

    await allureStep('Send POST /posts with payload', async () => {
      response = await postsApi.create(payload);
      body = await response.json();
      await attachRequestResponse('POST', '/posts', payload, response);
    });

    await allureStep('Assert status 201', async () => {
      expect(response.status()).toBe(ApiConstants.CREATED);
    });

    await allureStep('Assert response echoes payload and has generated id', async () => {
      expect(body).toMatchObject({
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
      });
      expect(typeof body.id).toBe('number');
      expect(body.id).toBeGreaterThan(0);
    });
  });
});

test.describe('PUT /posts/{id} and DELETE /posts/{id}', () => {
  test('PUT returns 200 with the updated body reflected in response', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('Update post');
    await allureSeverity('critical');

    const updated = {
      userId: 1,
      title: 'Updated title',
      body: 'Updated body content',
    };

    let response!: APIResponse;
    let body!: Record<string, unknown>;

    await allureStep('Send PUT /posts/1 with updated payload', async () => {
      response = await postsApi.update(1, updated);
      body = await response.json();
      await attachRequestResponse('PUT', '/posts/1', updated, response);
    });

    await allureStep('Assert status 200 and updated fields in response', async () => {
      expect(response.status()).toBe(ApiConstants.OK);
      expect(body).toMatchObject({
        id: 1,
        title: updated.title,
        body: updated.body,
      });
    });
  });

  test('DELETE returns 200 or 204 with empty/nullish body', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('Delete post');
    await allureSeverity('normal');

    let response!: APIResponse;

    await allureStep('Send DELETE /posts/1', async () => {
      response = await postsApi.remove(1);
      await attachRequestResponse('DELETE', '/posts/1', null, response);
    });

    await allureStep('Assert status 200 or 204 with empty body', async () => {
      expect([ApiConstants.OK, ApiConstants.NO_CONTENT]).toContain(response.status());
      if (response.status() === ApiConstants.OK) {
        const body = await response.json();
        expect(body).toEqual({});
      }
    });
  });
});
