import { APIResponse } from '@playwright/test';
import { ApiService } from './PostsApi';

export interface ServiceHealth {
  status: 'ok' | 'degraded' | 'down';
  url: string;
  http_status?: number;
  error?: string;
  latency_ms?: number;
}

export interface SystemHealth {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime_seconds: number;
  services: Record<string, ServiceHealth>;
}

export class HealthApi extends ApiService {
  all(): Promise<APIResponse>  { return this.get('/health'); }
  ui(): Promise<APIResponse>   { return this.get('/health/ui'); }
  api(): Promise<APIResponse>  { return this.get('/health/api'); }
  self(): Promise<APIResponse> { return this.get('/health/self'); }
  openapi(): Promise<APIResponse> { return this.get('/openapi.json'); }
}
