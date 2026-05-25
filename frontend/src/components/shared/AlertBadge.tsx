/**
 * AlertBadge — Severity badge with glow halo.
 */
import type { AlertSeverity } from '@/types'

const badgeStyles: Record<AlertSeverity, string> = {
  critical: 'badge-critical',
  warning:  'badge-warning',
  anomaly:  'badge-anomaly',
}

const labels: Record<AlertSeverity, string> = {
  critical: 'Critical',
  warning:  'Warning',
  anomaly:  'Anomaly',
}

interface AlertBadgeProps {
  severity: AlertSeverity
  className?: string
}

export function AlertBadge({ severity, className = '' }: AlertBadgeProps) {
  return (
    <span className={`${badgeStyles[severity]} ${className}`}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: severity === 'critical' ? '#fb7185' : severity === 'warning' ? '#fbbf24' : '#e879f9',
          boxShadow: `0 0 6px ${severity === 'critical' ? 'rgba(244,63,94,0.5)' : severity === 'warning' ? 'rgba(245,158,11,0.5)' : 'rgba(217,70,239,0.5)'}`,
        }}
      />
      {labels[severity]}
    </span>
  )
}
