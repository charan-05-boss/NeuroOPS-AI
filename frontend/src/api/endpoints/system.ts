import { rootApiClient } from '@/api/client'
import type { SystemInfoResponse } from '@/types'

export const systemApi = {
  getSystemInfo: (): Promise<SystemInfoResponse> =>
    rootApiClient.get<SystemInfoResponse>('/system-info').then((r) => r.data),
}
