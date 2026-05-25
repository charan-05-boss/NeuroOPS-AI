import apiClient, { rootApiClient } from '@/api/client'
import type { AiAnalysisResponse } from '@/types'

export const aiApi = {
  analyze: (): Promise<AiAnalysisResponse> =>
    rootApiClient.get<AiAnalysisResponse>('/ai-analysis').then((r) => r.data),

  /** Legacy root-level chat (kept for backward compat) */
  chat: (message: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<{ response: string }> =>
    rootApiClient.post<{ response: string }>('/ai-chat', { message, history }).then((r) => r.data),

  /** Context-rich v1 chat — injects live metrics + alerts + predictions */
  chatV2: (
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<{ response: string; context_used: string[] }> =>
    apiClient
      .post<{ response: string; context_used: string[] }>('/chat', { message, history })
      .then((r) => r.data),
}
