/**
 * MetricCard — Spatial KPI card with 3D hover, glowing icon halo,
 * and cinematic progress bar.
 */
import { motion } from 'framer-motion'
import { cn, fmt, percentColor } from '@/utils/formatters'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  unit?: 'percent' | 'gb' | 'mb' | 'count'
  icon: LucideIcon
  iconColor?: string
  subtitle?: string
  className?: string
  index?: number
}

export function MetricCard({
  title,
  value,
  unit = 'percent',
  icon: Icon,
  iconColor = 'text-brand-400',
  subtitle,
  className,
  index = 0,
}: MetricCardProps) {
  const displayValue =
    unit === 'percent' ? fmt.percent(value) :
    unit === 'gb'      ? fmt.gb(value) :
    unit === 'mb'      ? fmt.mb(value) :
    fmt.count(value)

  const valueColor = unit === 'percent' ? percentColor(value) : 'text-white'

  // Map icon colors to glow colors
  const glowMap: Record<string, string> = {
    'text-brand-400':  'rgba(99, 102, 241, 0.25)',
    'text-violet-400': 'rgba(139, 92, 246, 0.25)',
    'text-amber-400':  'rgba(245, 158, 11, 0.25)',
    'text-cyan-400':   'rgba(6, 182, 212, 0.25)',
    'text-emerald-400':'rgba(16, 185, 129, 0.25)',
    'text-rose-400':   'rgba(244, 63, 94, 0.25)',
  }
  const glowColor = glowMap[iconColor] ?? 'rgba(99, 102, 241, 0.2)'

  const bgMap: Record<string, string> = {
    'text-brand-400':  'rgba(99, 102, 241, 0.10)',
    'text-violet-400': 'rgba(139, 92, 246, 0.10)',
    'text-amber-400':  'rgba(245, 158, 11, 0.10)',
    'text-cyan-400':   'rgba(6, 182, 212, 0.10)',
    'text-emerald-400':'rgba(16, 185, 129, 0.10)',
    'text-rose-400':   'rgba(244, 63, 94, 0.10)',
  }
  const bgColor = bgMap[iconColor] ?? 'rgba(99, 102, 241, 0.08)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        y: -3,
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
      }}
      className={cn('card-spatial p-6 flex flex-col gap-4 cursor-default', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="metric-label">{title}</span>
        <div
          className={cn('p-2.5 rounded-xl', iconColor)}
          style={{
            background: bgColor,
            boxShadow: `0 0 16px -3px ${glowColor}`,
            border: `1px solid ${glowColor}`,
          }}
        >
          <Icon size={16} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className={cn('metric-value', valueColor)}>{displayValue}</span>
      </div>

      {/* Progress bar (for percentages) */}
      {unit === 'percent' && (
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            className={cn(
              'h-full rounded-full',
              value >= 90 ? 'bg-rose-500' :
              value >= 75 ? 'bg-amber-500' :
              value >= 50 ? 'bg-yellow-500' :
              'bg-emerald-500',
            )}
            style={{
              boxShadow: `0 0 12px ${
                value >= 90 ? 'rgba(244,63,94,0.5)' :
                value >= 75 ? 'rgba(245,158,11,0.5)' :
                value >= 50 ? 'rgba(234,179,8,0.4)' :
                'rgba(16,185,129,0.4)'
              }`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 + 0.3 }}
          />
        </div>
      )}

      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </motion.div>
  )
}
