import { useState, useEffect } from 'react'
import {
  Cpu,
  HardDrive,
  Network,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'

import { MetricCard } from '@/components/shared/MetricCard'
import { AlertBadge } from '@/components/shared/AlertBadge'

import { CpuChart } from '@/components/charts/CpuChart'
import { MemoryChart } from '@/components/charts/MemoryChart'
import { NetworkChart } from '@/components/charts/NetworkChart'
import { DiskChart } from '@/components/charts/DiskChart'

import { useMetrics } from '@/hooks/useMetrics'
import { useAlerts } from '@/hooks/useAlerts'

import { aiApi } from '@/api/endpoints/ai'
import { fmt } from '@/utils/formatters'

import type { AiAnalysisResponse } from '@/types'

export function Dashboard() {
  const { current, history, systemInfo, isLoading, error } = useMetrics()

  const { data: alertsData, dismissAlert } = useAlerts(2000)

  const [aiResult, setAiResult] =
    useState<AiAnalysisResponse | null>(null)

  const [aiLoading, setAiLoading] = useState(false)

  const [aiError, setAiError] = useState<string | null>(null)

  const runAiAnalysis = async () => {
    setAiLoading(true)
    setAiError(null)

    try {
      const res = await aiApi.analyze()
      setAiResult(res)
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'AI analysis failed'
      )
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    runAiAnalysis()
  }, [])

  const activeAlerts =
    alertsData?.alerts.filter(
      (a) => a.status === 'active'
    ) || []

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Real-time system monitoring"
      />

      <PageWrapper>
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative mb-10 py-8 overflow-hidden"
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none mix-blend-screen"
            style={{
              background:
                'radial-gradient(ellipse, rgba(186, 26, 106, 0.12) 0%, rgba(139, 0, 74, 0.05) 40%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />

          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.5,
              }}
              className="text-[11px] font-bold uppercase tracking-widest text-[#BA1A6A] mb-4 flex items-center gap-2"
            >
              <span className="live-dot scale-75" />
              Neural monitoring active
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15,
                duration: 0.5,
              }}
              className="text-gradient-hero font-display text-3xl md:text-4xl font-bold tracking-tight mb-2"
            >
              System Intelligence
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
              }}
              className="text-slate-500 text-sm max-w-md"
            >
              Real-time AI-powered infrastructure
              monitoring with predictive analytics
              and autonomous anomaly detection.
            </motion.p>
          </div>
        </motion.div>

        {/* ERROR */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl flex items-center justify-between"
            style={{
              background:
                'rgba(244, 63, 94, 0.08)',
              border:
                '1px solid rgba(244, 63, 94, 0.2)',
            }}
          >
            <div className="flex items-center gap-3 text-sm text-rose-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />

              <span>
                <strong>Connection Error:</strong>{' '}
                {error}
              </span>
            </div>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-xl text-xs font-semibold transition-all"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* LOADING */}
        {isLoading && !current && (
          <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />

              Connecting to neural backend…
            </div>
          </div>
        )}

        {current && (
          <>
            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <MetricCard
                index={0}
                title="CPU Usage"
                value={current.cpu.percent}
                unit="percent"
                icon={Cpu}
                iconColor="text-[#BA1A6A]"
                subtitle={`${current.cpu.count_logical} logical cores`}
              />

              <MetricCard
                index={1}
                title="Memory"
                value={current.memory.percent}
                unit="percent"
                icon={Zap}
                iconColor="text-[#8B004A]"
                subtitle={`${fmt.gb(
                  current.memory.used_gb
                )} / ${fmt.gb(
                  current.memory.total_gb
                )}`}
              />

              <MetricCard
                index={2}
                title="Disk Usage"
                value={current.disk.percent}
                unit="percent"
                icon={HardDrive}
                iconColor="text-neutral-400"
                subtitle={`${fmt.gb(
                  current.disk.free_gb
                )} free`}
              />

              <MetricCard
                index={3}
                title="Processes"
                value={current.processes.total}
                unit="count"
                icon={Network}
                iconColor="text-[#F2EFE7]"
                subtitle={`${current.processes.running} running`}
              />
            </div>

            {/* ALERTS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-base font-semibold text-white font-display">
                    Active Alerts
                  </p>

                  <Link
                    to="/alerts"
                    className="text-xs text-[#BA1A6A] hover:text-[#F2EFE7] flex items-center gap-1 transition-colors"
                  >
                    View history{' '}
                    <ArrowRight size={12} />
                  </Link>
                </div>

                {activeAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />

                    <p className="text-sm font-semibold text-white">
                      System Stable
                    </p>

                    <p className="text-xs text-slate-500">
                      No active alerts detected
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {activeAlerts
                      .slice(0, 3)
                      .map((alert) => (
                        <div
                          key={String(alert.id)}
                          className="p-3.5 rounded-xl flex items-start justify-between gap-3"
                          style={{
                            background:
                              'rgba(255,255,255,0.02)',
                            border:
                              '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <AlertTriangle
                              className={`w-4 h-4 shrink-0 mt-0.5 ${alert.severity ===
                                'critical'
                                ? 'text-rose-400'
                                : alert.severity ===
                                  'warning'
                                  ? 'text-amber-400'
                                  : 'text-fuchsia-400'
                                }`}
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-xs font-semibold text-white truncate">
                                  {alert.title}
                                </span>

                                <AlertBadge
                                  severity={alert.severity}
                                  className="scale-90 origin-left"
                                />
                              </div>

                              <p className="text-xs text-slate-500 truncate">
                                {alert.message}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              dismissAlert(
                                String(alert.id)
                              )
                            }
                            className="text-[10px] text-slate-600 hover:text-rose-400 font-semibold uppercase tracking-wider shrink-0 transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </PageWrapper>
    </>
  )
}