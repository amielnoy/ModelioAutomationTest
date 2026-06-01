import { test, expect } from '../../src/fixtures';
import { allureEpic, allureFeature, allureStory, allureSeverity, allureStep, allureRequirement, allureAttachment } from '../../src/utils/allure';
import { ApiConstants } from '../../src/api/ApiConstants';
import { JiraLinks } from '../constants';
import postsParams from '../data/posts.params.json';

type PostsParam = (typeof postsParams)[number];

test.describe('GET /posts/{id} — data-driven', { tag: '@api' }, () => {
  for (const params of postsParams as PostsParam[]) {
    test(`${params.scenario}`, async ({ postsApi }) => {
      await allureEpic('API');
      await allureFeature('Posts');
      await allureStory(params.scenario);
      await allureSeverity(params.expectedResult === 'found' ? 'critical' : 'normal');
      await allureRequirement(JiraLinks.requirements.POSTS, 'PROJ-104 — Posts API requirement');

      let responseStatus!: number;
      let responseBody!: Record<string, unknown>;

      await allureStep(`GET /posts/${params.id}`, async () => {
        const response = await postsApi.getById(params.id);
        responseStatus = response.status();
        responseBody = await response.json();
        await allureAttachment(
          'Response',
          JSON.stringify({ status: responseStatus, body: responseBody }, null, 2),
          'application/json',
        );
      });

      await allureStep(`Assert status ${params.expectedStatus} (expected: ${params.expectedResult})`, async () => {
        expect(responseStatus).toBe(
          params.expectedStatus === 200 ? ApiConstants.OK : ApiConstants.NOT_FOUND,
        );
      });

      await allureStep('Assert response body matches expected shape', async () => {
        expect(responseBody).toMatchObject(params.expectedBody);
      });
    });
  }
});
