/**
 * StatusIndicator — Premium animated neural pulse indicator with glow.
 */
import { motion } from 'framer-motion'
import { cn } from '@/utils/formatters'

interface StatusIndicatorProps {
  connected: boolean
  lastUpdated?: Date | null
  className?: string
}

export function StatusIndicator({ connected, lastUpdated, className }: StatusIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative">
        <motion.div
          animate={connected ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={connected ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } : undefined}
          className={cn(
            'w-2 h-2 rounded-full',
            connected ? 'bg-emerald-400' : 'bg-slate-600',
          )}
          style={connected ? {
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6), 0 0 16px rgba(16, 185, 129, 0.3)',
          } : undefined}
        />
        {connected && (
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-400"
            animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut' }}
          />
        )}
      </div>
      <span className="text-xs text-slate-500 font-medium">
        {connected
          ? lastUpdated
            ? `Live · ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            : 'Live'
          : 'Disconnected'}
      </span>
    </div>
  )
}
