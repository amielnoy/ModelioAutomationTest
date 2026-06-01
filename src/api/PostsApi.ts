import { APIResponse } from '@playwright/test';
import { ApiClient } from './ApiClient';
import { RequestOptions } from './ApiClient';
import { Post, CreatePostPayload, UpdatePostPayload } from '../types/api.types';

/**
 * PostsApi — typed endpoint methods for /posts.
 * Tests never construct raw URLs or parse response bodies here;
 * they work with typed return values.
 */
export abstract class ApiService {
  constructor(protected readonly client: ApiClient) {}

  protected get(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.client.get(path, opts);
  }

  protected post(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.client.post(path, opts);
  }

  protected put(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.client.put(path, opts);
  }

  protected delete(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.client.delete(path, opts);
  }
}

export class PostsApi extends ApiService {
  constructor(client: ApiClient) {
    super(client);
  }

  async getAll(): Promise<APIResponse> {
    return this.get('/posts');
  }

  async getById(id: number): Promise<APIResponse> {
    return this.get(`/posts/${id}`);
  }

  async create(payload: CreatePostPayload): Promise<APIResponse> {
    return this.post('/posts', { data: payload });
  }

  async update(id: number, payload: UpdatePostPayload): Promise<APIResponse> {
    return this.put(`/posts/${id}`, { data: payload });
  }

  async remove(id: number): Promise<APIResponse> {
    return this.delete(`/posts/${id}`);
  }

  /** Convenience: parse body as Post */
  async getByIdAs(id: number): Promise<{ response: APIResponse; body: Post }> {
    const response = await this.getById(id);
    const body: Post = await response.json();
    return { response, body };
  }
}
