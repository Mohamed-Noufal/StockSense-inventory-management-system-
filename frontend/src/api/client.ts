import { HealthResponse, ReadyResponse } from '../types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new ApiError(res.status, `Health check failed with status ${res.status}`);
    }
    return res.json();
  },

  async getReadiness(): Promise<ReadyResponse> {
    const res = await fetch(`${API_BASE}/ready`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new ApiError(res.status, `Readiness check failed with status ${res.status}`);
    }
    return res.json();
  },
};
