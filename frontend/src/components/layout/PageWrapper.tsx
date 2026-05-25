/**
 * PageWrapper — Wraps page content with animated enter transition,
 * ambient glow orb, and generous cinematic padding.
 */
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`relative px-8 pt-8 pb-20 w-full ${className ?? ''}`}
    >
      {/* Ambient glow orb — top right */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(139, 0, 74, 0.15) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </motion.div>
  )
}
