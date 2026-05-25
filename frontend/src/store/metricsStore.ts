/**
 * NeuroOps AI — Metrics Zustand Store
 * Holds the current snapshot, rolling chart history, and connection status.
 */
import { create } from 'zustand'
import type { SystemMetricsSnapshot, SystemInfoResponse, FlatMetricsResponse } from '@/types'

const CHART_HISTORY_LIMIT = 60 // points to show in charts

const mapFlatToSnapshot = (
  flat: FlatMetricsResponse,
  systemInfo: SystemInfoResponse | null
): SystemMetricsSnapshot => {
  const totalMemory = systemInfo?.total_memory_gb ?? 8.0
  const totalDisk = systemInfo?.total_disk_gb ?? 256.0
  const logicalCores = systemInfo?.cpu_cores_logical ?? 4

  const ramPercent = flat.ram
  const usedMemory = (ramPercent / 100) * totalMemory
  const availMemory = totalMemory - usedMemory

  const diskPercent = flat.disk
  const usedDisk = (diskPercent / 100) * totalDisk
  const freeDisk = totalDisk - usedDisk

  const networkSentMb = flat.network_sent / (1024 * 1024)
  const networkRecvMb = flat.network_received / (1024 * 1024)

  return {
    timestamp: new Date().toISOString(),
    cpu: {
      percent: flat.cpu,
      count_logical: logicalCores,
      count_physical: systemInfo?.cpu_cores_physical ?? null,
      frequency_mhz: null,
    },
    memory: {
      total_gb: totalMemory,
      available_gb: +availMemory.toFixed(2),
      used_gb: +usedMemory.toFixed(2),
      percent: ramPercent,
    },
    disk: {
      total_gb: totalDisk,
      used_gb: +usedDisk.toFixed(2),
      free_gb: +freeDisk.toFixed(2),
      percent: diskPercent,
      mountpoint: '/',
    },
    network: {
      bytes_sent_mb: +networkSentMb.toFixed(3),
      bytes_recv_mb: +networkRecvMb.toFixed(3),
      packets_sent: 0,
      packets_recv: 0,
    },
    processes: {
      total: 0,
      running: 0,
      sleeping: 0,
    },
  }
}

interface MetricsState {
  current: SystemMetricsSnapshot | null
  history: SystemMetricsSnapshot[]
  systemInfo: SystemInfoResponse | null
  isLoading: boolean
  isConnected: boolean
  lastUpdated: Date | null
  error: string | null

  setCurrentSnapshot: (snapshot: SystemMetricsSnapshot) => void
  setSystemInfo: (info: SystemInfoResponse) => void
  updateFromFlatMetrics: (flat: FlatMetricsResponse) => void
  setLoading: (loading: boolean) => void
  setConnected: (connected: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useMetricsStore = create<MetricsState>()((set) => ({
  current: null,
  history: [],
  systemInfo: null,
  isLoading: false,
  isConnected: false,
  lastUpdated: null,
  error: null,

  setCurrentSnapshot: (snapshot) =>
    set((state) => ({
      current: snapshot,
      history: [...state.history, snapshot].slice(-CHART_HISTORY_LIMIT),
      lastUpdated: new Date(),
      isConnected: true,
      error: null,
    })),

  setSystemInfo: (systemInfo) => set({ systemInfo }),

  updateFromFlatMetrics: (flat) =>
    set((state) => {
      const snapshot = mapFlatToSnapshot(flat, state.systemInfo)
      return {
        current: snapshot,
        history: [...state.history, snapshot].slice(-CHART_HISTORY_LIMIT),
        lastUpdated: new Date(),
        isConnected: true,
        error: null,
      }
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error, isConnected: false }),
  reset: () => set({ current: null, history: [], systemInfo: null, isLoading: false, isConnected: false }),
}))

