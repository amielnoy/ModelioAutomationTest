import { test, expect } from '../../src/fixtures';
import { ApiConstants } from '../../src/api/ApiConstants';
import { Post } from '../../src/types/api.types';
import {
  allureEpic,
  allureFeature,
  allureStory,
  allureSeverity,
  allureStep,
  allureRequirement,
  allureBug,
} from '../../src/utils/allure';
import { PostFixtures, JiraLinks } from '../constants';
import { APIResponse } from '@playwright/test';
import { attachRequestResponse } from './helpers';

test.describe('GET /posts', { tag: '@api' }, () => {
  test('returns 200 with a non-empty JSON array matching Post schema', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('GET all posts');
    await allureSeverity('critical');
    await allureRequirement(JiraLinks.requirements.POSTS, 'PROJ-104 — Posts API requirement');
    await allureBug(JiraLinks.bugs.POSTS_DELETE, 'BUG-14 — Posts DELETE response');

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

test.describe('GET /posts/{id}', { tag: '@api' }, () => {
  test('returns 200 and correct body for a valid id', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('GET single post');
    await allureSeverity('critical');
    await allureRequirement(JiraLinks.requirements.POSTS, 'PROJ-104 — Posts API requirement');

    let response!: APIResponse;
    let body!: Post;

    await allureStep(`Send GET /posts/${PostFixtures.VALID_ID}`, async () => {
      const result = await postsApi.getByIdAs(PostFixtures.VALID_ID);
      response = result.response;
      body = result.body;
      await attachRequestResponse('GET', `/posts/${PostFixtures.VALID_ID}`, null, response);
    });

    await allureStep('Assert status 200 and correct body', async () => {
      expect(response.status()).toBe(ApiConstants.OK);
      expect(body).toMatchObject({
        userId: expect.any(Number),
        id: PostFixtures.VALID_ID,
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
    await allureRequirement(JiraLinks.requirements.POSTS, 'PROJ-104 — Posts API requirement');

    let response!: APIResponse;

    await allureStep(`Send GET /posts/${PostFixtures.NONEXISTENT_ID}`, async () => {
      response = await postsApi.getById(PostFixtures.NONEXISTENT_ID);
      await attachRequestResponse('GET', `/posts/${PostFixtures.NONEXISTENT_ID}`, null, response);
    });

    await allureStep('Assert status 404', async () => {
      expect(response.status()).toBe(ApiConstants.NOT_FOUND);
    });
  });
});

test.describe('POST /posts', { tag: '@api' }, () => {
  test('returns 201 Created, echoes payload, and includes a generated id', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('Create post');
    await allureSeverity('critical');
    await allureRequirement(JiraLinks.requirements.POSTS, 'PROJ-104 — Posts API requirement');

    const payload = PostFixtures.CREATE_PAYLOAD;

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

test.describe('PUT /posts/{id} and DELETE /posts/{id}', { tag: '@api' }, () => {
  test('PUT returns 200 with the updated body reflected in response', async ({ postsApi }) => {
    await allureEpic('API');
    await allureFeature('Posts');
    await allureStory('Update post');
    await allureSeverity('critical');
    await allureRequirement(JiraLinks.requirements.POSTS, 'PROJ-104 — Posts API requirement');

    const updated = PostFixtures.UPDATE_PAYLOAD;

    let response!: APIResponse;
    let body!: Record<string, unknown>;

    await allureStep(`Send PUT /posts/${PostFixtures.VALID_ID} with updated payload`, async () => {
      response = await postsApi.update(PostFixtures.VALID_ID, updated);
      body = await response.json();
      await attachRequestResponse('PUT', `/posts/${PostFixtures.VALID_ID}`, updated, response);
    });

    await allureStep('Assert status 200 and updated fields in response', async () => {
      expect(response.status()).toBe(ApiConstants.OK);
      expect(body).toMatchObject({
        id: PostFixtures.VALID_ID,
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
    await allureRequirement(JiraLinks.requirements.POSTS, 'PROJ-104 — Posts API requirement');
    await allureBug(JiraLinks.bugs.POSTS_DELETE, 'BUG-14 — Posts DELETE response');

    let response!: APIResponse;

    await allureStep(`Send DELETE /posts/${PostFixtures.VALID_ID}`, async () => {
      response = await postsApi.remove(PostFixtures.VALID_ID);
      await attachRequestResponse('DELETE', `/posts/${PostFixtures.VALID_ID}`, null, response);
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
