import { APIResponse } from '@playwright/test';
import { ApiClient } from './ApiClient';
import { ApiService } from './ApiService';
import { Post, CreatePostPayload, UpdatePostPayload } from '../types/api.types';

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

  async getByIdAs(id: number): Promise<{ response: APIResponse; body: Post }> {
    const response = await this.getById(id);
    const body: Post = await response.json();
    return { response, body };
  }
}
