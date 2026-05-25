/**
 * Alerts — Premium alert management with glassmorphic controls.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Plus, X, ShieldAlert, SlidersHorizontal } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBadge } from '@/components/shared/AlertBadge'
import { useAlerts } from '@/hooks/useAlerts'
import { fmt } from '@/utils/formatters'
import type { AlertCategory, AlertSeverity } from '@/types'

export function Alerts() {
  const { data, isLoading, createAlert, dismissAlert } = useAlerts(2000)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all')

  const [form, setForm] = useState({
    title: '',
    message: '',
    severity: 'warning' as AlertSeverity,
    category: 'manual' as AlertCategory,
  })

  const handleCreate = async () => {
    if (!form.title.trim()) return
    await createAlert(form)
    setShowForm(false)
    setForm({ title: '', message: '', severity: 'warning', category: 'manual' })
  }

  const filteredAlerts = data?.alerts.filter((alert) => {
    const statusMatch = statusFilter === 'all' || alert.status === statusFilter
    const severityMatch = severityFilter === 'all' || alert.severity === severityFilter
    return statusMatch && severityMatch
  }) || []

  return (
    <>
      <Header title="Alert Center" subtitle="Real-time system events, threshold rules and anomaly log history" />
      <PageWrapper>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Stats indicator */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              <strong className="text-rose-400 font-semibold">{data?.active ?? 0} active</strong> · {data?.total ?? 0} total alerts
            </span>
          </div>

          {/* Action button */}
          <button
            id="create-alert-btn"
            onClick={() => setShowForm(true)}
            className="btn-primary self-start md:self-auto"
          >
            <Plus size={15} /> Trigger Manual Alert
          </button>
        </div>

        {/* Create manual alert form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="card-cinematic p-6 mb-8 space-y-4"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-white flex items-center gap-2 font-display">
                    <ShieldAlert className="text-[#BA1A6A] w-4 h-4" /> Inject Simulated System Alert
                  </p>
                  <button onClick={() => setShowForm(false)} className="btn-ghost p-1"><X size={16} /></button>
                </div>
                <input
                  className="input-base mb-3"
                  placeholder="Alert title (e.g. CPU Spike Detected)"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <textarea
                  className="input-base resize-none mb-3"
                  rows={2}
                  placeholder="Detailed alert description message..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1">Severity</span>
                    <select
                      className="input-base"
                      value={form.severity}
                      onChange={(e) => setForm({ ...form, severity: e.target.value as AlertSeverity })}
                    >
                      {(['warning', 'critical', 'anomaly'] as AlertSeverity[]).map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1">Category</span>
                    <select
                      className="input-base"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as AlertCategory })}
                    >
                      {(['cpu', 'memory', 'disk', 'network', 'anomaly', 'manual'] as AlertCategory[]).map((c) => (
                        <option key={c} value={c}>{c.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
                  <button onClick={handleCreate} className="btn-primary">Create Trigger</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter controls */}
        <div
          className="rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: 'rgba(10, 10, 32, 0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="text-slate-500 w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filters</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              {(['all', 'active', 'resolved'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    statusFilter === status
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  style={statusFilter === status ? {
                    background: 'rgba(139, 0, 74, 0.12)',
                    border: '1px solid rgba(139, 0, 74, 0.2)',
                    boxShadow: '0 0 12px -3px rgba(139, 0, 74, 0.25)',
                  } : { border: '1px solid transparent' }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  severityFilter === 'all' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
                style={severityFilter === 'all' ? { background: 'rgba(255,255,255,0.06)' } : {}}
              >
                All Severities
              </button>
              {(['warning', 'critical', 'anomaly'] as AlertSeverity[]).map((sev) => {
                const colors = {
                  critical: { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', text: 'text-rose-300' },
                  warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: 'text-amber-300' },
                  anomaly: { bg: 'rgba(139,0,74,0.1)', border: 'rgba(139,0,74,0.2)', text: 'text-[#BA1A6A]' },
                }
                const c = colors[sev]
                return (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      severityFilter === sev ? c.text : 'text-slate-500 hover:text-slate-300'
                    }`}
                    style={severityFilter === sev ? { background: c.bg, border: `1px solid ${c.border}` } : { border: '1px solid transparent' }}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Alert list */}
        {isLoading && !data ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/10 border-t-[#8B004A] rounded-full animate-spin" />
              Loading alert streams…
            </div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="card p-14 text-center" style={{ borderStyle: 'dashed' }}>
            <CheckCircle size={36} className="mx-auto mb-3 text-emerald-500" style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' }} />
            <p className="font-semibold text-white mb-1 font-display">No alerts found</p>
            <p className="text-sm text-slate-500">There are no alerts matching the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredAlerts.map((alert) => {
                const severityStyles = {
                  critical: { borderLeft: '3px solid #f43f5e', bg: 'rgba(244,63,94,0.04)' },
                  warning: { borderLeft: '3px solid #f59e0b', bg: 'rgba(245,158,11,0.04)' },
                  anomaly: { borderLeft: '3px solid #BA1A6A', bg: 'rgba(139,0,74,0.04)' },
                }
                const s = alert.status === 'active' ? severityStyles[alert.severity] : { borderLeft: '3px solid rgba(255,255,255,0.06)', bg: 'transparent' }

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className={`card p-5 flex items-start justify-between gap-4 transition-all duration-300 ${
                      alert.status !== 'active' ? 'opacity-60 hover:opacity-100' : ''
                    }`}
                    style={{
                      borderLeft: s.borderLeft,
                      background: s.bg,
                    }}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <AlertTriangle
                        size={18}
                        className={`shrink-0 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-rose-400' :
                          alert.severity === 'warning'  ? 'text-amber-400' :
                          'text-[#BA1A6A]'
                        }`}
                        style={{
                          filter: alert.severity === 'critical' && alert.status === 'active'
                            ? 'drop-shadow(0 0 4px rgba(244,63,94,0.5))'
                            : undefined,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-white text-sm truncate">{alert.title}</span>
                          <AlertBadge severity={alert.severity} />
                          <span
                            className="text-xs text-slate-500 px-2 py-0.5 rounded-lg uppercase tracking-wider"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                          >
                            {alert.category}
                          </span>
                          {alert.metric_value !== null && alert.threshold !== null && (
                            <span className="text-xs text-slate-600 font-mono">
                              ({alert.metric_value.toFixed(1)}% &gt; {alert.threshold.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-1">{alert.message}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span>Triggered {fmt.relativeTime(alert.created_at)}</span>
                          {alert.resolved_at && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-500">Resolved {fmt.relativeTime(alert.resolved_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {alert.status === 'active' ? (
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="btn-ghost p-1.5 text-slate-600 hover:text-rose-400 shrink-0 transition-colors"
                        title="Mark as Resolved"
                      >
                        <X size={15} />
                      </button>
                    ) : (
                      <div
                        className="flex items-center gap-1.5 text-xs text-emerald-400 shrink-0 font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
                      >
                        <CheckCircle size={12} /> Resolved
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </PageWrapper>
    </>
  )
}
