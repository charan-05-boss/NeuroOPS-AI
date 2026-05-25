/**
 * CpuChart — Cinematic real-time CPU usage area chart with glow effects.
 */
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmt, chartColors, glowColor } from '@/utils/formatters'
import type { SystemMetricsSnapshot } from '@/types'

const CinematicTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'rgba(10, 10, 32, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      <p style={{ fontSize: 10, color: '#5c5c7a', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
          <span style={{ color: '#9d9dbc' }}>{p.name}:</span>
          <span style={{ color: '#f0f0ff', fontWeight: 600 }}>
            {typeof p.value === 'number' ? `${p.value}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

interface CpuChartProps {
  history: SystemMetricsSnapshot[]
}

export function CpuChart({ history }: CpuChartProps) {
  const data = history.map((s) => ({
    time: fmt.time(s.timestamp),
    cpu: +s.cpu.percent.toFixed(1),
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.cpu} stopOpacity={0.35} />
            <stop offset="100%" stopColor={chartColors.cpu} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fill: '#5c5c7a', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#5c5c7a', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CinematicTooltip />} />
        <Area
          type="monotone"
          dataKey="cpu"
          stroke={chartColors.cpu}
          strokeWidth={2}
          fill="url(#gradCpu)"
          dot={false}
          activeDot={{
            r: 5,
            fill: chartColors.cpu,
            stroke: 'rgba(10,10,32,0.8)',
            strokeWidth: 2,
            style: { filter: `drop-shadow(0 0 6px ${chartColors.cpu})` },
          }}
          isAnimationActive={true}
          animationDuration={600}
          style={{ filter: `drop-shadow(0 0 4px ${glowColor(chartColors.cpu)})` }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
