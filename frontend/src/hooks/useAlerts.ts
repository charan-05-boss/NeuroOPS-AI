/**
 * useAlerts — fetches and manages the alert list with polling.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { alertsApi } from '@/api/endpoints/alerts'
import type { Alert, AlertCreateRequest, AlertListResponse } from '@/types'

export function useAlerts(pollIntervalMs = 10_000) {
  const [data, setData] = useState<AlertListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetch = useCallback(async () => {
    try {
      const result = await alertsApi.list()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetch().finally(() => setIsLoading(false))
    intervalRef.current = setInterval(fetch, pollIntervalMs)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetch, pollIntervalMs])

  const createAlert = async (payload: AlertCreateRequest): Promise<Alert> => {
    const alert = await alertsApi.create(payload)
    await fetch()
    return alert
  }

  const dismissAlert = async (id: string): Promise<void> => {
    await alertsApi.dismiss(id)
    await fetch()
  }

  return { data, isLoading, error, createAlert, dismissAlert, refetch: fetch }
}
