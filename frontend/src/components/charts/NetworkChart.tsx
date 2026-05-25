/**
 * NetworkChart — Cinematic bytes sent/received line chart.
 */
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { fmt, chartColors, glowColor } from '@/utils/formatters'
import type { SystemMetricsSnapshot } from '@/types'

const CinematicTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(10, 10, 32, 0.9)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px',
      padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: 10, color: '#5c5c7a', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
          <span style={{ color: '#9d9dbc' }}>{p.name}:</span>
          <span style={{ color: '#f0f0ff', fontWeight: 600 }}>{typeof p.value === 'number' ? `${p.value} MB` : '—'}</span>
        </div>
      ))}
    </div>
  )
}

interface NetworkChartProps { history: SystemMetricsSnapshot[] }

export function NetworkChart({ history }: NetworkChartProps) {
  const data = history.map((s) => ({
    time: fmt.time(s.timestamp),
    sent: +s.network.bytes_sent_mb.toFixed(1),
    recv: +s.network.bytes_recv_mb.toFixed(1),
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="time" tick={{ fill: '#5c5c7a', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#5c5c7a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}MB`} />
        <Tooltip content={<CinematicTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#5c5c7a', paddingTop: 8 }}
          formatter={(v) => <span style={{ color: '#9d9dbc' }}>{v === 'sent' ? '↑ Sent' : '↓ Received'}</span>}
        />
        <Line type="monotone" dataKey="sent" stroke={chartColors.network} strokeWidth={2}
          dot={false} activeDot={{ r: 4, fill: chartColors.network, stroke: 'rgba(10,10,32,0.8)', strokeWidth: 2, style: { filter: `drop-shadow(0 0 6px ${chartColors.network})` } }}
          isAnimationActive animationDuration={600} style={{ filter: `drop-shadow(0 0 3px ${glowColor(chartColors.network)})` }}
        />
        <Line type="monotone" dataKey="recv" stroke="#22d3ee" strokeWidth={2}
          dot={false} activeDot={{ r: 4, fill: '#22d3ee', stroke: 'rgba(10,10,32,0.8)', strokeWidth: 2, style: { filter: 'drop-shadow(0 0 6px #22d3ee)' } }}
          isAnimationActive animationDuration={600} style={{ filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.3))' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
