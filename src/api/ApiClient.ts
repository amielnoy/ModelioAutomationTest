import { APIRequestContext, APIResponse } from '@playwright/test';
import { Timeout } from './Timeout';
import { ApiConstants } from './ApiConstants';
import { config } from '../utils/config';

export interface RequestOptions {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  data?: unknown;
  timeout?: number;
  /**
   * How many times to retry on network error or 5xx.
   * Default: 3 retries for resilient service calls.
   */
  retries?: number;
}

/**
 * ApiClient — thin, typed wrapper over Playwright's APIRequestContext.
 *
 * Why Playwright API over axios?
 * – Already bundled; no extra dep.
 * – Shares the same trace context as UI tests (requests appear in trace viewer).
 * – Native HAR recording support.
 *
 * This is the ONLY place that knows the base URL, default headers, and timeout.
 * Tests import typed endpoint helpers, not this class directly.
 */
const DEFAULT_RETRIES = 3;
const RETRY_BACKOFF_MS = 200;

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(
    private readonly request: APIRequestContext,
    options: {
      baseUrl: string;
      timeout?: number;
      headers?: Record<string, string>;
    },
  ) {
    this.baseUrl        = options.baseUrl.replace(/\/$/, '');
    this.defaultTimeout = options.timeout ?? config.api.timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
      ...options.headers,
    };
  }

  // ── HTTP verbs ─────────────────────────────────────────────────────────────

  async get(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('GET', path, opts);
  }

  async post(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('POST', path, opts);
  }

  async put(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('PUT', path, opts);
  }

  async patch(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('PATCH', path, opts);
  }

  async delete(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('DELETE', path, opts);
  }

  // ── Core ───────────────────────────────────────────────────────────────────

  private async send(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    opts: RequestOptions,
  ): Promise<APIResponse> {
    const url = `${this.baseUrl}${path}`;
    const retries = opts.retries ?? DEFAULT_RETRIES;
    const timeout = new Timeout(opts.timeout ?? this.defaultTimeout);
    const headers = { ...this.defaultHeaders, ...opts.headers };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await timeout.withTimeout(
          this.request.fetch(url, {
            method,
            headers,
            params: opts.params as Record<string, string>,
            data: opts.data !== undefined ? JSON.stringify(opts.data) : undefined,
            timeout: timeout.value,
            failOnStatusCode: false,
          }),
        );

        if (response.status() >= ApiConstants.INTERNAL_SERVER_ERROR && attempt < retries) {
          await this.sleep(RETRY_BACKOFF_MS * (attempt + 1));
          continue;
        }

        return response;
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries) {
          await this.sleep(RETRY_BACKOFF_MS * (attempt + 1));
        }
      }
    }

    throw lastError ?? new Error(`Request failed: ${method} ${url}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
