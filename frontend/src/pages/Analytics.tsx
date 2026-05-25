/**
 * Analytics — AI anomaly detection results with cinematic visuals.
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, TrendingDown } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { analyticsApi } from '@/api/endpoints/analytics'
import type { AnomalyDetectionResult, SystemHealthScore } from '@/types'
import { fmt } from '@/utils/formatters'
import { cn } from '@/utils/formatters'

export function Analytics() {
  const [anomalies, setAnomalies] = useState<AnomalyDetectionResult | null>(null)
  const [health, setHealth] = useState<SystemHealthScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsApi.getAnomalies(), analyticsApi.getHealthScore()])
      .then(([a, h]) => { setAnomalies(a); setHealth(h) })
      .finally(() => setLoading(false))
  }, [])

  const gradeColor: Record<string, string> = {
    A: 'text-emerald-400', B: 'text-green-400',
    C: 'text-yellow-400',  D: 'text-amber-400', F: 'text-rose-400',
  }
  const gradeGlow: Record<string, string> = {
    A: 'rgba(16,185,129,0.3)', B: 'rgba(34,197,94,0.3)',
    C: 'rgba(234,179,8,0.3)',  D: 'rgba(245,158,11,0.3)', F: 'rgba(244,63,94,0.3)',
  }

  return (
    <>
      <Header title="Analytics" subtitle="AI-powered anomaly detection" />
      <PageWrapper>
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/10 border-t-[#8B004A] rounded-full animate-spin" />
              Running anomaly detection…
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Health score */}
            {health && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="card p-8 flex items-center gap-8"
              >
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={cn('text-6xl font-black font-display', gradeColor[health.grade] ?? 'text-[#F2EFE7]')}
                    style={{ textShadow: `0 0 30px ${gradeGlow[health.grade] ?? 'transparent'}` }}
                  >
                    {health.grade}
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest">Grade</span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-[#F2EFE7] font-display mb-1">{health.summary}</p>
                  <p className="text-sm text-slate-400">Health score: {health.score}/100</p>
                  <div className="mt-4 h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <motion.div
                      className={cn('h-full rounded-full', gradeColor[health.grade]?.replace('text-', 'bg-') ?? 'bg-[#8B004A]')}
                      style={{ boxShadow: `0 0 12px ${gradeGlow[health.grade] ?? 'transparent'}` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${health.score}%` }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Anomaly summary */}
            {anomalies && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { label: 'Samples', value: anomalies.samples_used, icon: BrainCircuit },
                  { label: 'Anomalies', value: anomalies.anomalies_detected, icon: TrendingDown },
                  { label: 'Anomaly Rate', value: `${(anomalies.anomaly_rate * 100).toFixed(1)}%`, icon: TrendingDown },
                  { label: 'Model Status', value: anomalies.is_model_trained ? 'Trained' : 'Insufficient Data', icon: BrainCircuit },
                ].map(({ label, value, icon: Icon }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="card-spatial p-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          background: 'rgba(139, 0, 74, 0.1)',
                          border: '1px solid rgba(139, 0, 74, 0.2)',
                        }}
                      >
                        <Icon size={14} className="text-[#BA1A6A]" />
                      </div>
                      <span className="metric-label">{label}</span>
                    </div>
                    <span className="text-xl font-bold text-[#F2EFE7] font-display">{value}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Anomaly points table */}
            {anomalies && anomalies.points.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card overflow-hidden"
              >
                <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="section-heading mb-0 font-display">Anomaly Log</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-600 text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <th className="text-left px-6 py-3">Time</th>
                        <th className="text-left px-6 py-3">Status</th>
                        <th className="text-left px-6 py-3">CPU</th>
                        <th className="text-left px-6 py-3">Memory</th>
                        <th className="text-left px-6 py-3">Disk</th>
                        <th className="text-left px-6 py-3">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anomalies.points.filter(p => p.is_anomaly).slice(0, 20).map((p, i) => (
                        <tr
                          key={i}
                          className="transition-colors duration-200"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-6 py-3 font-mono text-xs text-slate-500">{fmt.time(p.timestamp)}</td>
                          <td className="px-6 py-3">
                            <span className="badge-critical">Anomaly</span>
                          </td>
                          <td className="px-6 py-3 text-slate-300">{fmt.percent(p.cpu_percent)}</td>
                          <td className="px-6 py-3 text-slate-300">{fmt.percent(p.memory_percent)}</td>
                          <td className="px-6 py-3 text-slate-300">{fmt.percent(p.disk_percent)}</td>
                          <td className="px-6 py-3 font-mono text-rose-400 text-xs">{p.anomaly_score.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {anomalies && !anomalies.is_model_trained && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-10 text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: 'rgba(139, 0, 74, 0.1)',
                    border: '1px solid rgba(139, 0, 74, 0.2)',
                    boxShadow: '0 0 20px -4px rgba(139, 0, 74, 0.2)',
                  }}
                >
                  <BrainCircuit size={28} className="text-[#BA1A6A]" />
                </div>
                <p className="font-medium text-[#F2EFE7] mb-1 font-display">Not enough data yet</p>
                <p className="text-sm text-slate-500">Need at least {20} metric samples to train the anomaly model. Keep the backend running.</p>
              </motion.div>
            )}
          </div>
        )}
      </PageWrapper>
    </>
  )
}
