import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react'
import { Cpu, HardDrive, Network, Zap, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MetricCard } from '@/components/shared/MetricCard'
import { CpuChart } from '@/components/charts/CpuChart'
import { MemoryChart } from '@/components/charts/MemoryChart'
import { NetworkChart } from '@/components/charts/NetworkChart'
import { DiskChart } from '@/components/charts/DiskChart'
import { useMetrics } from '@/hooks/useMetrics'
import { useAlerts } from '@/hooks/useAlerts'
import { aiApi } from '@/api/endpoints/ai'
import { fmt } from '@/utils/formatters'
import { AlertBadge } from '@/components/shared/AlertBadge'
import type { AiAnalysisResponse } from '@/types'

export function Dashboard() {
  const { current, history, systemInfo, isLoading, error } = useMetrics()
  const { data: alertsData, dismissAlert } = useAlerts(2000)

  const [aiResult, setAiResult] = useState<AiAnalysisResponse | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const runAiAnalysis = async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await aiApi.analyze()
      setAiResult(res)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis failed')
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    runAiAnalysis()
  }, [])

  const activeAlerts = alertsData?.alerts.filter(a => a.status === 'active') || []

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Real-time system monitoring"
      />
      <PageWrapper>
        {/* ── Immersive Hero Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-10 py-8 overflow-hidden"
        >
          {/* Ambient glow behind hero */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none mix-blend-screen"
            style={{
              background: 'radial-gradient(ellipse, rgba(186, 26, 106, 0.12) 0%, rgba(139, 0, 74, 0.05) 40%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-[11px] font-bold uppercase tracking-widest text-[#BA1A6A] mb-4 flex items-center gap-2"
            >
              <span className="live-dot scale-75" />
              Neural monitoring active
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-gradient-hero font-display text-3xl md:text-4xl font-bold tracking-tight mb-2"
            >
              System Intelligence
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-slate-500 text-sm max-w-md"
            >
              Real-time AI-powered infrastructure monitoring with predictive analytics and autonomous anomaly detection.
            </motion.p>
          </div>
        </motion.div>

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl flex items-center justify-between"
            style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              boxShadow: '0 0 30px -8px rgba(244, 63, 94, 0.15)',
            }}
          >
            <div className="flex items-center gap-3 text-sm text-rose-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" style={{ boxShadow: '0 0 8px rgba(244,63,94,0.5)' }} />
              <span><strong>Connection Error:</strong> {error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-xl text-xs font-semibold transition-all"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Connection / loading state */}
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
            {/* ── KPI Row ── */}
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
                subtitle={`${fmt.gb(current.memory.used_gb)} / ${fmt.gb(current.memory.total_gb)}`}
              />
              <MetricCard
                index={2}
                title="Disk Usage"
                value={current.disk.percent}
                unit="percent"
                icon={HardDrive}
                iconColor="text-neutral-400"
                subtitle={`${fmt.gb(current.disk.free_gb)} free`}
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

            {/* ── Charts Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
              {[
                { title: 'CPU Usage', chart: <CpuChart history={history} /> },
                { title: 'Memory Usage', chart: <MemoryChart history={history} /> },
                { title: 'Disk Usage', chart: <DiskChart history={history} /> },
                { title: 'Network I/O', chart: <NetworkChart history={history} /> },
              ].map(({ title, chart }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="card p-6 border-0 bg-transparent shadow-none"
                >
                  <p className="text-sm font-semibold text-[#F2EFE7] font-display tracking-tight mb-4">{title}</p>
                  {chart}
                </motion.div>
              ))}
            </div>

            {/* ── AI System Analyst Panel ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-2xl mb-8 p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(139,0,74,0.1) 0%, rgba(20,20,20,0.4) 50%, rgba(10,10,10,0.8) 100%)',
                border: '1px solid rgba(139,0,74,0.2)',
                boxShadow: '0 10px 40px -10px rgba(139,0,74,0.15), 0 0 0 1px rgba(255,255,255,0.05)',
              }}
            >
              {/* Gradient border overlay */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  padding: '1px',
                  background: 'linear-gradient(135deg, rgba(186,26,106,0.3), rgba(20,20,20,0), rgba(139,0,74,0.2))',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />

              {/* Ambient glow */}
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#8B004A]/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'rgba(139, 0, 74, 0.15)',
                        border: '1px solid rgba(139, 0, 74, 0.3)',
                        boxShadow: '0 0 16px -3px rgba(139, 0, 74, 0.4)',
                      }}
                    >
                      <Zap size={18} className="text-[#BA1A6A]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm font-display">AI System Analyst</h3>
                      <p className="text-[10px] text-slate-500">Real-time heuristics & predictive optimization</p>
                    </div>
                  </div>
                  <button
                    onClick={runAiAnalysis}
                    disabled={aiLoading}
                    className="btn-glass text-xs font-semibold disabled:opacity-50"
                  >
                    <ArrowRight size={13} className={aiLoading ? 'animate-spin' : ''} />
                    {aiLoading ? 'Analyzing...' : 'Refresh Analysis'}
                  </button>
                </div>

                {aiLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 py-3">
                    <div className="h-6 w-2/3 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
                    </div>
                  </motion.div>
                )}

                {aiError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl text-xs flex justify-between items-center"
                    style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}
                  >
                    <span className="text-rose-300">Failed to load AI Insights: {aiError}</span>
                    <button onClick={runAiAnalysis} className="text-rose-400 font-semibold underline">Retry</button>
                  </motion.div>
                )}

                {!aiLoading && !aiError && aiResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Insight Quote Box */}
                    <div
                      className="p-4 rounded-xl text-xs leading-relaxed"
                      style={{
                        background: 'rgba(139, 0, 74, 0.08)',
                        border: '1px solid rgba(139, 0, 74, 0.2)',
                      }}
                    >
                      <strong className="text-[#BA1A6A]">Concise Insight: </strong>
                      <span className="text-[#F2EFE7]">"{aiResult.concise_insight}"</span>
                    </div>

                    {/* Dynamic sections */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {[
                        { title: 'Identified Bottlenecks', color: 'rose', items: aiResult.possible_issues, emptyMsg: 'No performance bottlenecks identified.' },
                        { title: 'Suspicious Patterns', color: 'fuchsia', items: aiResult.suspicious_behavior, emptyMsg: 'No anomalous patterns or threats detected.' },
                        { title: 'DevOps Recommendations', color: 'emerald', items: aiResult.recommendations, emptyMsg: 'No optimization actions required.' },
                      ].map(({ title, color, items, emptyMsg }) => (
                        <div
                          key={title}
                          className="p-4 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <p className={`font-semibold text-${color}-400 mb-2.5 uppercase tracking-wider text-[10px]`}>{title}</p>
                          {items.length === 0 ? (
                            <p className="text-slate-600 italic">{emptyMsg}</p>
                          ) : (
                            <ul className="space-y-1.5 text-slate-300">
                              {items.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className={`w-1 h-1 rounded-full bg-${color}-400 mt-1.5 flex-shrink-0`} />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-[9px] text-slate-600 text-right">
                      Analyzed: {aiResult.system_state}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* ── Bottom Section: Specs & Active Alerts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Hardware Specs & Stats */}
              <div className="lg:col-span-6 flex flex-col gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="card p-6 flex-1"
                >
                  <p className="text-sm font-semibold font-display text-gradient-cyan mb-4">System Hardware Specs</p>
                  <div className="grid grid-cols-2 gap-5 text-sm">
                    {[
                      { label: 'OS Platform', value: systemInfo ? `${systemInfo.os_name} (${systemInfo.architecture})` : 'N/A' },
                      { label: 'Hostname', value: systemInfo?.hostname ?? 'N/A' },
                      { label: 'CPU Model', value: systemInfo?.cpu_model ?? 'N/A' },
                      { label: 'Total Memory', value: systemInfo ? `${systemInfo.total_memory_gb} GB` : 'N/A' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-1.5">
                        <span className="metric-label">{label}</span>
                        <span className="font-semibold text-white truncate" title={value}>{value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card p-6 flex-1"
                >
                  <p className="text-sm font-semibold font-display text-gradient mb-4">Real-time IO & Activity</p>
                  <div className="grid grid-cols-2 gap-5 text-sm">
                    {[
                      { label: 'Uptime', value: systemInfo?.uptime ?? 'N/A' },
                      { label: 'Net Sent', value: fmt.mb(current.network.bytes_sent_mb) },
                      { label: 'Net Recv', value: fmt.mb(current.network.bytes_recv_mb) },
                      { label: 'Logical Cores', value: systemInfo?.cpu_cores_logical ?? 'N/A' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-1.5">
                        <span className="metric-label">{label}</span>
                        <span className="font-semibold text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Active Alerts Panel */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="lg:col-span-6 card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-base font-semibold text-white font-display">Active Alerts</p>
                    <Link
                      to="/alerts"
                      className="text-xs text-[#BA1A6A] hover:text-[#F2EFE7] flex items-center gap-1 transition-colors"
                    >
                      View history <ArrowRight size={12} />
                    </Link>
                  </div>

                  {activeAlerts.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-10 text-center rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}
                    >
                      <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' }} />
                      <p className="text-sm font-semibold text-white">System Stable</p>
                      <p className="text-xs text-slate-500">No active alerts detected</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {activeAlerts.slice(0, 3).map((alert: { id: Key | null | undefined; severity: string; title: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; message: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined }) => (
                        <div
                          key={alert.id}
                          className="p-3.5 rounded-xl flex items-start justify-between gap-3 transition-all duration-300 hover:border-slate-600"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-rose-400' :
                              alert.severity === 'warning' ? 'text-amber-400' :
                                'text-fuchsia-400'
                              }`} style={{
                                filter: alert.severity === 'critical'
                                  ? 'drop-shadow(0 0 4px rgba(244,63,94,0.5))'
                                  : undefined,
                              }} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-xs font-semibold text-white truncate">{alert.title}</span>
                                <AlertBadge severity={alert.severity} className="scale-90 origin-left" />
                              </div>
                              <p className="text-xs text-slate-500 truncate">{alert.message}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-[10px] text-slate-600 hover:text-rose-400 font-semibold uppercase tracking-wider shrink-0 transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      ))}
                      {activeAlerts.length > 3 && (
                        <p className="text-xs text-slate-600 text-center py-1">
                          + {activeAlerts.length - 3} more active alerts
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 flex items-center justify-between text-xs text-slate-600" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span>Thresholds: CPU &gt; 85% · RAM &gt; 90% · Disk &gt; 90%</span>
                  <span className="flex items-center gap-1.5">
                    <span className="live-dot scale-75" /> Live Monitoring
                  </span>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </PageWrapper>
    </>
  )
}
