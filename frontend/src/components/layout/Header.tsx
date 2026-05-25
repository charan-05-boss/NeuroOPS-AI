/**
 * Header — Spatial contextual top bar.
 */
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { useMetricsStore } from '@/store/metricsStore'
import { motion } from 'framer-motion'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { isConnected, lastUpdated } = useMetricsStore()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-6 z-20 flex items-center justify-between h-14 px-6 mx-8 rounded-2xl"
      style={{
        background: 'rgba(5, 5, 5, 0.4)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-[14px] font-bold text-neutral-400 font-display tracking-tight">NeuroOps AI</span>
        <span className="text-neutral-600 font-light">/</span>
        <h1 className="text-[15px] font-semibold text-[#F2EFE7] font-display tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {subtitle && (
          <p className="hidden md:block text-xs text-neutral-500">{subtitle}</p>
        )}
        <div className="w-[1px] h-4 bg-white/10 hidden md:block" />
        <StatusIndicator connected={isConnected} lastUpdated={lastUpdated} />
      </div>
    </motion.header>
  )
}
