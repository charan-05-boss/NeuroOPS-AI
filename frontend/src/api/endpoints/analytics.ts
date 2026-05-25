import apiClient from '@/api/client'
import type { AnomalyDetectionResult, SystemHealthScore } from '@/types'

export const analyticsApi = {
  getAnomalies: (): Promise<AnomalyDetectionResult> =>
    apiClient.get<AnomalyDetectionResult>('/analytics/anomalies').then((r) => r.data),

  getHealthScore: (): Promise<SystemHealthScore> =>
    apiClient.get<SystemHealthScore>('/analytics/health-score').then((r) => r.data),
}
