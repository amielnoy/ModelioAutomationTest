import { APIResponse } from '@playwright/test';
import { allureAttachment } from '../../src/utils/allure';

export async function attachRequestResponse(
  method: string,
  url: string,
  requestData: unknown,
  response: APIResponse,
): Promise<void> {
  const requestInfo = { method, url, body: requestData ?? null };
  await allureAttachment('Request', JSON.stringify(requestInfo, null, 2), 'application/json');

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(response.headers())) headers[k] = v;
  await allureAttachment(
    'Response headers',
    JSON.stringify({ status: response.status(), headers }, null, 2),
    'application/json',
  );

  const rawBody = await response.text();
  try {
    await allureAttachment('Response payload', JSON.stringify(JSON.parse(rawBody), null, 2), 'application/json');
  } catch {
    await allureAttachment('Response payload', rawBody, 'text/plain');
  }
}
