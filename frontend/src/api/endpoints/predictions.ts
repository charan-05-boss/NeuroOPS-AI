import apiClient from '@/api/client'
import type { PredictionResponse } from '@/types'

export const predictionsApi = {
  get: (): Promise<PredictionResponse> =>
    apiClient.get<PredictionResponse>('/predictions').then((r) => r.data),
}
