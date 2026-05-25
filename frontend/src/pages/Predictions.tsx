/**
 * NeuroOps AI — Predictive Analytics Dashboard
 * Enterprise-grade ML forecasting: CPU/RAM trend graphs, stability scoring,
 * anomaly indicators, overload gauge, and AI prediction summaries.
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Minus, Cpu, HardDrive, RefreshCw,
  AlertTriangle, ShieldCheck, BrainCircuit, Activity, Zap,
  MemoryStick, Eye, Radio,
} from 'lucide-react'
import { Header }      from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { predictionsApi } from '@/api/endpoints/predictions'
import { analyticsApi }   from '@/api/endpoints/analytics'
import type {
  MetricForecast, PredictionResponse, RiskLevel, TrendDirection,
  AnomalyDetectionResult, SystemHealthScore,
} from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

const METRIC_COLORS = {
  cpu:    '#BA1A6A',   // Murrey light
  memory: '#8B004A',   // Murrey base
  disk:   '#7f284e',   // Murrey dark
}

function gradeHex(grade: string) {
  return ({ A: '#10b981', B: '#22c55e', C: '#f59e0b', D: '#f97316', F: '#ef4444' })[grade] ?? '#94a3b8'
}

function riskPalette(level: RiskLevel) {
  return {
    low:      { glow: '#10b981', text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', grad: 'from-emerald-950/60 to-teal-950/40'      },
    moderate: { glow: '#f59e0b', text: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   grad: 'from-amber-950/60 to-yellow-950/40'      },
    high:     { glow: '#f97316', text: 'text-orange-400',  border: 'border-orange-500/30',  bg: 'bg-orange-500/10',  grad: 'from-orange-950/60 to-red-950/40'        },
    critical: { glow: '#ef4444', text: 'text-rose-400',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10',    grad: 'from-rose-950/70 to-pink-950/50'         },
  }[level]
}

function trendBadge(dir: TrendDirection) {
  if (dir === 'rising')  return { Icon: TrendingUp,   cls: 'text-rose-400 bg-rose-500/10 border-rose-500/25',     label: 'Rising'  }
  if (dir === 'falling') return { Icon: TrendingDown, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', label: 'Falling' }
  return                        { Icon: Minus,        cls: 'text-slate-400 bg-slate-800/60 border-slate-700',       label: 'Stable'  }
}

// Custom recharts tooltip
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(10,10,32,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p style={{ fontSize: 10, color: '#5c5c7a', marginBottom: 4 }}>Step {label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
          <span style={{ color: '#9d9dbc', fontSize: 12 }}>{p.name}:</span>
          <span style={{ color: '#f0f0ff', fontWeight: 600, fontSize: 12 }}>{typeof p.value === 'number' ? `${p.value.toFixed(1)}%` : '—'}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stability Ring (SVG)
// ─────────────────────────────────────────────────────────────────────────────

function StabilityRing({ score, grade }: { score: number; grade: string }) {
  const R = 56
  const circ = 2 * Math.PI * R
  const color = gradeHex(grade)
  return (
    <div className="relative w-[140px] h-[140px] flex-shrink-0">
      <svg width={130} height={130} className="rotate-[-90deg]">
        {/* Track */}
        <circle cx={65} cy={65} r={R} fill="none" stroke="#1e293b" strokeWidth={12} />
        {/* Glow ring (blur duplicate) */}
        <motion.circle
          cx={65} cy={65} r={R} fill="none"
          stroke={color} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          style={{ filter: `blur(4px)`, opacity: 0.45 }}
        />
        {/* Main ring */}
        <motion.circle
          cx={65} cy={65} r={R} fill="none"
          stroke={color} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-black leading-none" style={{ color }}>{grade}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Grade</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Overload Gauge (SVG arc)
// ─────────────────────────────────────────────────────────────────────────────

function OverloadGauge({ probability }: { probability: number }) {
  const pct  = Math.round(probability * 100)
  const color = pct < 30 ? '#10b981' : pct < 55 ? '#f59e0b' : pct < 80 ? '#f97316' : '#ef4444'
  const ARC_LENGTH = 172
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 150, height: 95 }}>
        <svg width={150} height={105} viewBox="0 0 150 105">
          {/* Track */}
          <path d="M 17 88 A 58 58 0 0 1 133 88" fill="none" stroke="#1e293b" strokeWidth={11} strokeLinecap="round" />
          {/* Glow */}
          <motion.path
            d="M 17 88 A 58 58 0 0 1 133 88" fill="none"
            stroke={color} strokeWidth={14} strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            initial={{ strokeDashoffset: ARC_LENGTH }}
            animate={{ strokeDashoffset: ARC_LENGTH * (1 - probability) }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
            style={{ filter: 'blur(4px)', opacity: 0.5 }}
          />
          {/* Arc */}
          <motion.path
            d="M 17 88 A 58 58 0 0 1 133 88" fill="none"
            stroke={color} strokeWidth={11} strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            initial={{ strokeDashoffset: ARC_LENGTH }}
            animate={{ strokeDashoffset: ARC_LENGTH * (1 - probability) }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
          {/* Needle */}
          <motion.line x1={75} y1={88} x2={75} y2={42}
            stroke={color} strokeWidth={3} strokeLinecap="round"
            style={{ transformOrigin: '75px 88px' }}
            initial={{ rotate: -135 }} animate={{ rotate: -135 + pct * 2.7 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          />
          <circle cx={75} cy={88} r={5} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        </svg>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
          <p className="text-xl font-black text-white leading-none">{pct}%</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Overload Risk</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined trend + forecast chart (full-width)
// ─────────────────────────────────────────────────────────────────────────────

function TrendForecastChart({
  historyCpu, historyMem,
  cpuFc, memFc,
}: {
  historyCpu: number[]
  historyMem: number[]
  cpuFc: MetricForecast
  memFc: MetricForecast
}) {
  const histLen = historyCpu.length
  const combined = [
    ...historyCpu.map((cpu, i) => ({
      i,
      cpu,
      mem: historyMem[i] ?? null,
      cpuFc: null as number | null,
      memFc: null as number | null,
      zone: 'history' as const,
    })),
    ...cpuFc.predicted_values.map((v, i) => ({
      i: histLen + i,
      cpu: null as number | null,
      mem: null as number | null,
      cpuFc: v,
      memFc: memFc.predicted_values[i] ?? null,
      zone: 'forecast' as const,
    })),
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={combined} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={METRIC_COLORS.cpu}    stopOpacity={0.40} />
            <stop offset="100%" stopColor={METRIC_COLORS.cpu}  stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={METRIC_COLORS.memory}  stopOpacity={0.30} />
            <stop offset="100%" stopColor={METRIC_COLORS.memory} stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="gradCpuFc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={METRIC_COLORS.cpu}    stopOpacity={0.18} />
            <stop offset="100%" stopColor={METRIC_COLORS.cpu}  stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="i" hide />
        <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}%`} />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
          wrapperStyle={{ paddingTop: 8 }}
        />
        {/* Threshold lines */}
        <ReferenceLine y={cpuFc.threshold} stroke={METRIC_COLORS.cpu}    strokeDasharray="4 3" strokeWidth={1.2} label={{ value: `CPU ${cpuFc.threshold}%`, fill: METRIC_COLORS.cpu, fontSize: 9, position: 'insideTopRight' }} />
        <ReferenceLine y={memFc.threshold} stroke={METRIC_COLORS.memory} strokeDasharray="4 3" strokeWidth={1.2} label={{ value: `RAM ${memFc.threshold}%`, fill: METRIC_COLORS.memory, fontSize: 9, position: 'insideTopRight' }} />
        {/* History — solid */}
        <Area name="CPU History" type="monotone" dataKey="cpu"
          stroke={METRIC_COLORS.cpu} strokeWidth={2}
          fill="url(#gradCpu)" dot={false} connectNulls activeDot={{ r: 3, fill: METRIC_COLORS.cpu }} />
        <Area name="RAM History" type="monotone" dataKey="mem"
          stroke={METRIC_COLORS.memory} strokeWidth={2}
          fill="url(#gradMem)" dot={false} connectNulls activeDot={{ r: 3, fill: METRIC_COLORS.memory }} />
        {/* Forecasts — dashed */}
        <Line name="CPU Forecast" type="monotone" dataKey="cpuFc"
          stroke={METRIC_COLORS.cpu} strokeWidth={2} strokeDasharray="6 3"
          dot={false} connectNulls />
        <Line name="RAM Forecast" type="monotone" dataKey="memFc"
          stroke={METRIC_COLORS.memory} strokeWidth={2} strokeDasharray="6 3"
          dot={false} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Anomaly bar chart
// ─────────────────────────────────────────────────────────────────────────────

function AnomalyBarChart({ anomalies }: { anomalies: AnomalyDetectionResult }) {
  const data = anomalies.points.slice(-30).map((p, i) => ({
    i,
    cpu:  p.cpu_percent,
    mem:  p.memory_percent,
    flag: p.is_anomaly ? Math.max(p.cpu_percent, p.memory_percent) : 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} barGap={1} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="i" hide />
        <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}%`} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="cpu" name="CPU"  fill={METRIC_COLORS.cpu}    radius={[2, 2, 0, 0]} opacity={0.7} maxBarSize={8} />
        <Bar dataKey="mem" name="RAM"  fill={METRIC_COLORS.memory} radius={[2, 2, 0, 0]} opacity={0.6} maxBarSize={8} />
        <Bar dataKey="flag" name="Anomaly" fill="#ef4444" radius={[2, 2, 0, 0]} opacity={0.9} maxBarSize={8} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric mini-card
// ─────────────────────────────────────────────────────────────────────────────

function MetricMiniCard({
  fc, label, color, Icon, index,
}: {
  fc: MetricForecast
  label: string
  color: string
  Icon: React.ElementType
  index: number
}) {
  const badge = trendBadge(fc.trend_direction)
  const BadgeIcon = badge.Icon
  const willBreach = fc.will_exceed_threshold
  const pct = fc.current_value

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
      className="card-spatial p-5 flex flex-col gap-3"
      style={{ borderColor: willBreach ? `${color}40` : undefined }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon size={14} style={{ color }} />
          </div>
          <span className="text-xs font-semibold text-white">{label}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-semibold ${badge.cls}`}>
          <BadgeIcon size={9} />
          {badge.label}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
          <span>Current: <strong className="text-white">{pct.toFixed(1)}%</strong></span>
          <span>Peak: <strong className={willBreach ? 'text-rose-400' : 'text-white'}>{fc.predicted_peak.toFixed(1)}%</strong></span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: willBreach ? '#ef4444' : color, boxShadow: `0 0 6px ${willBreach ? '#ef4444' : color}` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 + index * 0.08 }}
          />
        </div>
        {/* Forecast bar */}
        <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden mt-1">
          <motion.div
            className="h-full rounded-full opacity-60"
            style={{ background: color, backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 4px, #0f172a40 4px, #0f172a40 6px)` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(fc.predicted_peak, 100)}%` }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.35 + index * 0.08 }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
          <span>Now</span>
          <span>Forecast peak ↑</span>
        </div>
      </div>

      {/* Confidence band */}
      <div className="flex items-center justify-between text-[9px] text-slate-500">
        <span className="font-mono">{fc.confidence_lower.toFixed(1)}% – {fc.confidence_upper.toFixed(1)}%</span>
        {willBreach && (
          <span className="flex items-center gap-1 text-rose-400 font-semibold animate-pulse">
            <AlertTriangle size={9} /> Breach risk
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Prediction Summary panel
// ─────────────────────────────────────────────────────────────────────────────

function AiSummaryPanel({
  stability, data,
}: {
  stability: NonNullable<PredictionResponse['stability']>
  data: PredictionResponse
}) {
  const windowMin = Math.round((data.forecast_steps * data.forecast_interval_seconds) / 60)
  const forecasts = [data.cpu_forecast, data.memory_forecast, data.disk_forecast].filter(Boolean) as MetricForecast[]
  const breaching  = forecasts.filter(f => f.will_exceed_threshold)
  const rising     = forecasts.filter(f => f.trend_direction === 'rising')

  const lines: { icon: string; text: string; color: string }[] = []

  if (stability.risk_level === 'low') {
    lines.push({ icon: '✅', text: `System appears stable. All metrics within safe predicted bounds for the next ${windowMin} minute(s).`, color: 'text-emerald-300' })
  }
  if (rising.length > 0) {
    lines.push({ icon: '📈', text: `${rising.map(f => f.metric.toUpperCase()).join(' and ')} showing upward trend. Monitor resource allocation.`, color: 'text-amber-300' })
  }
  if (breaching.length > 0) {
    lines.push({ icon: '⚠️', text: `${breaching.map(f => f.metric.toUpperCase()).join(', ')} predicted to breach alert threshold within ${windowMin} min. Scaling or optimization recommended.`, color: 'text-rose-300' })
  }
  if (stability.overload_probability > 0.6) {
    lines.push({ icon: '🔴', text: `High overload probability (${Math.round(stability.overload_probability * 100)}%). Consider horizontal scaling or killing non-critical processes.`, color: 'text-rose-400' })
  }
  if (data.cpu_forecast?.trend_slope && data.cpu_forecast.trend_slope > 0.5) {
    lines.push({ icon: '🖥️', text: `CPU acceleration detected — slope of +${data.cpu_forecast.trend_slope.toFixed(2)}%/sample. Possible runaway process or compute-heavy workload.`, color: 'text-orange-300' })
  }
  if (lines.length === 0) {
    lines.push({ icon: '🟢', text: 'No significant anomalies or risk factors detected. System is operating normally.', color: 'text-emerald-300' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 0, 74, 0.1), rgba(20, 20, 20, 0.4), rgba(10, 10, 10, 0.8))',
        border: '1px solid rgba(139, 0, 74, 0.2)',
        boxShadow: '0 8px 40px -12px rgba(139, 0, 74, 0.15)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#8B004A]/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#8B004A]/20 border border-[#8B004A]/30 flex items-center justify-center">
          <BrainCircuit size={14} className="text-[#BA1A6A]" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">AI Prediction Summary</p>
          <p className="text-[9px] text-[#BA1A6A]/70 uppercase tracking-wider">ML-generated operational insights</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[9px] text-[#BA1A6A]/60">
          <Radio size={10} className="animate-pulse" />
          LIVE
        </div>
      </div>

      <div className="space-y-3">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            className="flex items-start gap-3 text-sm leading-relaxed"
          >
            <span className="text-base leading-none mt-0.5 flex-shrink-0">{line.icon}</span>
            <p className={line.color}>{line.text}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[#8B004A]/20 flex items-center justify-between text-[9px] text-[#BA1A6A]/60">
        <span>Forecast window: {windowMin} min · {data.forecast_steps} steps · {data.forecast_interval_seconds}s interval</span>
        <span>{data.samples_used} samples analysed</span>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Anomaly Indicator pills
// ─────────────────────────────────────────────────────────────────────────────

function AnomalyIndicators({ anomalies, health }: { anomalies: AnomalyDetectionResult; health: SystemHealthScore }) {
  const recent = anomalies.points.slice(-5).filter(p => p.is_anomaly)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card-spatial p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-white flex items-center gap-2">
          <Eye size={13} className="text-[#BA1A6A]" /> Anomaly Detector
        </p>
        <div className="flex items-center gap-1.5 text-[9px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A6A] animate-pulse" />
          <span className="text-[#BA1A6A]/70">Active</span>
        </div>
      </div>

      {/* Health pill + score */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xl font-black" style={{ color: gradeHex(health.grade) }}>{health.grade}</span>
          <span className="text-[8px] text-slate-600 uppercase">Health</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>System Health</span><span>{health.score}/100</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: gradeHex(health.grade), boxShadow: `0 0 6px ${gradeHex(health.grade)}` }}
              initial={{ width: 0 }}
              animate={{ width: `${health.score}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Samples', value: anomalies.samples_used },
          { label: 'Anomalies', value: anomalies.anomalies_detected, cls: anomalies.anomalies_detected > 0 ? 'text-rose-400' : 'text-white' },
          { label: 'Rate', value: `${(anomalies.anomaly_rate * 100).toFixed(1)}%`, cls: anomalies.anomaly_rate > 0.1 ? 'text-amber-400' : 'text-white' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-slate-900/40 rounded-lg p-2 text-center">
            <p className="text-[8px] text-slate-600 uppercase tracking-wider">{label}</p>
            <p className={`text-sm font-bold ${cls ?? 'text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent anomaly pills */}
      {recent.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Recent Anomalies</p>
          {recent.map((p, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-rose-950/30 border border-rose-500/20 text-[10px]">
              <AlertTriangle size={9} className="text-rose-400 flex-shrink-0" />
              <span className="text-slate-300">CPU {p.cpu_percent.toFixed(1)}% · RAM {p.memory_percent.toFixed(1)}%</span>
              <span className="ml-auto text-rose-400/60 font-mono">{p.anomaly_score.toFixed(3)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[10px] text-emerald-400">
          <ShieldCheck size={11} />
          <span>No recent anomalies detected</span>
        </div>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function Predictions() {
  const [pred,      setPred]      = useState<PredictionResponse | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyDetectionResult | null>(null)
  const [health,    setHealth]    = useState<SystemHealthScore | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, a, h] = await Promise.all([
        predictionsApi.get(),
        analyticsApi.getAnomalies(),
        analyticsApi.getHealthScore(),
      ])
      setPred(p); setAnomalies(a); setHealth(h)
      setLastRefresh(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load predictions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Auto-refresh every 30 s
    timerRef.current = setInterval(load, 30_000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [load])

  const stability = pred?.stability
  const riskC     = stability ? riskPalette(stability.risk_level) : null

  return (
    <>
      <Header title="Predictions" subtitle="ML-powered trend forecasting, anomaly detection & stability" />
      <PageWrapper>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(139,0,74,0.1)', border: '1px solid rgba(139,0,74,0.2)' }}>
              <BrainCircuit size={13} className="text-[#BA1A6A]" />
            </div>
            <span>Polynomial regression · Isolation Forest · Auto-refresh 30s</span>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-[10px] text-slate-600">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={load} disabled={loading}
              className="btn-glass text-xs font-semibold disabled:opacity-50"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading…' : 'Refresh Now'}
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-5 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertTriangle size={14} />{error}</span>
            <button onClick={load} className="text-rose-400 font-semibold underline text-xs">Retry</button>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && !pred && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0,1,2].map(i => <div key={i} className="card p-5 h-36" style={{ opacity: 1 - i * 0.15 }} />)}
            </div>
            <div className="card p-5 h-56" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[0,1,2].map(i => <div key={i} className="card p-4 h-44" style={{ opacity: 1 - i * 0.15 }} />)}
            </div>
          </div>
        )}

        {/* ── Not enough data ── */}
        {!loading && pred && !pred.is_model_ready && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-12 text-center flex flex-col items-center gap-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#8B004A]/10 border border-[#8B004A]/20 flex items-center justify-center">
              <Activity size={32} className="text-[#BA1A6A] animate-pulse" />
            </div>
            <div>
              <p className="text-xl font-bold text-white mb-2">Warming Up…</p>
              <p className="text-sm text-slate-400 max-w-sm">
                The prediction engine needs at least <strong className="text-white">10 metric samples</strong> to build reliable forecasts.
              </p>
              <p className="text-sm text-slate-500 mt-1">{pred.samples_used} / 10 collected</p>
            </div>
            <div className="w-full max-w-xs">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-[#BA1A6A] rounded-full"
                  style={{ boxShadow: '0 0 8px #8B004A' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((pred.samples_used / 10) * 100, 100)}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Main dashboard ── */}
        {!loading && pred && pred.is_model_ready && stability && (
          <AnimatePresence>
            <div className="space-y-6">

              {/* Row 1: Stability + Gauge + Anomaly detector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Stability card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className={`lg:col-span-5 relative overflow-hidden rounded-2xl border ${riskC?.border} bg-gradient-to-br ${riskC?.grad} backdrop-blur-sm p-6 flex items-center gap-6`}
                  style={{ boxShadow: `0 8px 40px -12px ${riskC?.glow}30` }}
                >
                  <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-20"
                    style={{ background: riskC?.glow }} />
                  <StabilityRing score={stability.score} grade={stability.grade} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">System Stability</p>
                    <p className="text-4xl font-black text-white leading-none mb-1">
                      {stability.score.toFixed(0)}<span className="text-xl text-slate-500">/100</span>
                    </p>
                    <p className="text-sm text-slate-300 mb-3 leading-snug">{stability.summary}</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${riskC?.border} ${riskC?.bg} ${riskC?.text}`}>
                      {stability.risk_level === 'low' ? <ShieldCheck size={11} /> : <AlertTriangle size={11} />}
                      {stability.risk_level.charAt(0).toUpperCase() + stability.risk_level.slice(1)} Risk Level
                    </span>
                  </div>
                </motion.div>

                {/* Overload gauge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="lg:col-span-3 card-spatial p-6 flex flex-col items-center justify-center gap-2"
                >
                  <OverloadGauge probability={stability.overload_probability} />
                  <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                    Likelihood of threshold breach in{' '}
                    <strong className="text-slate-300">
                      {Math.round((pred.forecast_steps * pred.forecast_interval_seconds) / 60)} min
                    </strong>
                  </p>
                </motion.div>

                {/* Anomaly + Health detector */}
                <div className="lg:col-span-4">
                  {anomalies && health && (
                    <AnomalyIndicators anomalies={anomalies} health={health} />
                  )}
                </div>
              </div>

              {/* Row 2: Full-width trend + forecast chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="card p-6"
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#F2EFE7] flex items-center gap-2">
                      <Zap size={14} className="text-[#BA1A6A]" />
                      CPU &amp; RAM Trend + Forecast
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Solid lines = history · Dashed = ML forecast · Red lines = alert thresholds
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    {[
                      { color: METRIC_COLORS.cpu,    label: 'CPU' },
                      { color: METRIC_COLORS.memory, label: 'RAM' },
                    ].map(({ color, label }) => (
                      <span key={label} className="flex items-center gap-1">
                        <span className="w-3 h-0.5 rounded" style={{ background: color }} />
                        {label}
                      </span>
                    ))}
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 rounded bg-rose-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#ef4444,#ef4444 3px,transparent 3px,transparent 6px)' }} />
                      Threshold
                    </span>
                  </div>
                </div>
                {pred.cpu_forecast && pred.memory_forecast && (
                  <TrendForecastChart
                    historyCpu={pred.history_cpu}
                    historyMem={pred.history_memory}
                    cpuFc={pred.cpu_forecast}
                    memFc={pred.memory_forecast}
                  />
                )}
              </motion.div>

              {/* Row 3: 3-column mini metric cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {pred.cpu_forecast && (
                  <MetricMiniCard fc={pred.cpu_forecast} label="CPU Usage" color={METRIC_COLORS.cpu} Icon={Cpu} index={0} />
                )}
                {pred.memory_forecast && (
                  <MetricMiniCard fc={pred.memory_forecast} label="Memory (RAM)" color={METRIC_COLORS.memory} Icon={MemoryStick} index={1} />
                )}
                {pred.disk_forecast && (
                  <MetricMiniCard fc={pred.disk_forecast} label="Disk Usage" color={METRIC_COLORS.disk} Icon={HardDrive} index={2} />
                )}
              </div>

              {/* Row 4: Anomaly bar chart + AI summary */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Anomaly bar chart */}
                {anomalies && anomalies.is_model_trained && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="lg:col-span-2 card p-6"
                  >
                    <p className="text-xs font-semibold text-white mb-1 flex items-center gap-2">
                      <AlertTriangle size={12} className="text-[#BA1A6A]" />
                      Anomaly Distribution (last 30 samples)
                    </p>
                    <p className="text-[9px] text-slate-600 mb-3">Red bars = flagged anomalous points</p>
                    <AnomalyBarChart anomalies={anomalies} />
                  </motion.div>
                )}

                {/* AI summary */}
                <div className={anomalies?.is_model_trained ? 'lg:col-span-3' : 'lg:col-span-5'}>
                  <AiSummaryPanel stability={stability} data={pred} />
                </div>
              </div>

              {/* Row 5: Risk factors */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="card p-6"
              >
                <p className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp size={13} className="text-amber-400" />
                  Contributing Risk Factors
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {stability.contributing_factors.map((factor, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.32 + i * 0.05 }}
                      className="flex items-start gap-2.5 text-sm text-slate-300"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        stability.risk_level === 'low'      ? 'bg-emerald-400' :
                        stability.risk_level === 'moderate' ? 'bg-amber-400'   :
                        stability.risk_level === 'high'     ? 'bg-orange-400'  : 'bg-rose-400'
                      }`} />
                      <span className="text-xs leading-relaxed">{factor}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-700 pb-1">
                <span>{pred.samples_used} samples · {pred.forecast_steps} steps · {pred.forecast_interval_seconds}s interval · Polynomial deg 2</span>
                {lastRefresh && <span>Auto-refreshes every 30s · Last: {lastRefresh.toLocaleTimeString()}</span>}
              </div>

            </div>
          </AnimatePresence>
        )}

      </PageWrapper>
    </>
  )
}
