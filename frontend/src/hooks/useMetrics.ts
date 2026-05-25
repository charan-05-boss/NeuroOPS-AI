import { useEffect, useRef } from 'react'
import { metricsApi } from '@/api/endpoints/metrics'
import { systemApi } from '@/api/endpoints/system'
import { useMetricsStore } from '@/store/metricsStore'

const DEFAULT_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS ?? 2000)

export function useMetrics(intervalMs = DEFAULT_INTERVAL_MS) {
  const store = useMetricsStore()
  const { systemInfo, setSystemInfo, updateFromFlatMetrics, setLoading, setError } = store
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      try {
        // Fetch static system info first if not loaded yet
        if (!systemInfo) {
          const info = await systemApi.getSystemInfo()
          if (active) {
            setSystemInfo(info)
          }
        }

        // Fetch first metrics snapshot
        const flatMetrics = await metricsApi.getLiveSummary()
        if (active) {
          updateFromFlatMetrics(flatMetrics)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadData()

    intervalRef.current = setInterval(async () => {
      try {
        const flatMetrics = await metricsApi.getLiveSummary()
        if (active) {
          updateFromFlatMetrics(flatMetrics)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
        }
      }
    }, intervalMs)

    return () => {
      active = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [intervalMs]) // eslint-disable-line react-hooks/exhaustive-deps

  return store
}

