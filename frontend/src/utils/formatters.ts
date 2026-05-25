/** Format a number to a fixed decimal string with a unit suffix */
export const fmt = {
  percent: (v: number, decimals = 1) => `${v.toFixed(decimals)}%`,
  gb: (v: number) => `${v.toFixed(1)} GB`,
  mb: (v: number) => `${v.toFixed(1)} MB`,
  mhz: (v: number) => `${(v / 1000).toFixed(2)} GHz`,
  count: (v: number) => v.toLocaleString(),
  time: (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  relativeTime: (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    return `${Math.floor(diff / 3_600_000)}h ago`
  },
}

/** Colour-code a percentage value */
export function percentColor(v: number): string {
  if (v >= 90) return 'text-rose-400'
  if (v >= 75) return 'text-amber-400'
  if (v >= 50) return 'text-yellow-400'
  return 'text-emerald-400'
}

/** Tailwind stroke/fill colour for recharts based on metric key */
export const chartColors = {
  cpu:     'hsl(170 80% 50%)', // Neon teal
  memory:  'hsl(260 80% 60%)', // Neon purple
  disk:    'hsl(40 80% 55%)', // Neon orange
  network: 'hsl(200 80% 55%)', // Neon blue
} as const

/** Generate a semi‑transparent glow variant of a base HSL color */
export function glowColor(base: string): string {
  // Convert "hsl(...)" to "hsla(..., 0.3)"
  const match = base.match(/hsl\(([^)]+)\)/)
  if (!match) return base
  const components = match[1]
  return `hsla(${components}, 0.3)`
}

export type ChartColorKey = keyof typeof chartColors

/** clsx + tailwind-merge helper */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
