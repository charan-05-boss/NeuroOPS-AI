import { apiClient, rootApiClient } from '@/api/client'
import type { MetricsHistoryResponse, SystemMetricsSnapshot, FlatMetricsResponse } from '@/types'

export const metricsApi = {
  getCurrent: (): Promise<SystemMetricsSnapshot> =>
    apiClient.get<SystemMetricsSnapshot>('/metrics/current').then((r) => r.data),

  getHistory: (limit?: number): Promise<MetricsHistoryResponse> =>
    apiClient
      .get<MetricsHistoryResponse>('/metrics/history', { params: limit ? { limit } : undefined })
      .then((r) => r.data),

  getLiveSummary: (): Promise<FlatMetricsResponse> =>
    rootApiClient.get<FlatMetricsResponse>('/metrics').then((r) => r.data),
}

