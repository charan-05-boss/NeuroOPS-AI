import apiClient from '@/api/client'
import type { Alert, AlertCreateRequest, AlertListResponse } from '@/types'

export const alertsApi = {
  list: (): Promise<AlertListResponse> =>
    apiClient.get<AlertListResponse>('/alerts').then((r) => r.data),

  create: (payload: AlertCreateRequest): Promise<Alert> =>
    apiClient.post<Alert>('/alerts', payload).then((r) => r.data),

  dismiss: (id: string): Promise<Alert> =>
    apiClient.delete<Alert>(`/alerts/${id}`).then((r) => r.data),
}
