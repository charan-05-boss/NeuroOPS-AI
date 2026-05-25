/**
 * Settings — Premium environment configuration display.
 */
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { motion } from 'framer-motion'

const ENV_VARS = [
  { key: 'VITE_API_BASE_URL',    value: import.meta.env.VITE_API_BASE_URL ?? '(not set)', desc: 'Backend API base URL' },
  { key: 'VITE_POLL_INTERVAL_MS', value: import.meta.env.VITE_POLL_INTERVAL_MS ?? '3000', desc: 'Metrics polling interval (ms)' },
  { key: 'VITE_APP_NAME',         value: import.meta.env.VITE_APP_NAME ?? 'NeuroOps AI',  desc: 'Application display name' },
]

export function Settings() {
  return (
    <>
      <Header title="Settings" subtitle="Platform configuration" />
      <PageWrapper>
        <div className="max-w-2xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card overflow-hidden"
          >
            <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="section-heading mb-0 font-display">Frontend Environment</p>
            </div>
            <div>
              {ENV_VARS.map(({ key, value, desc }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start justify-between gap-4 px-6 py-5 transition-colors duration-200"
                  style={{ borderBottom: i < ENV_VARS.length - 1 ? '1px solid rgba(255,255,255,0.03)' : undefined }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <p className="font-mono text-sm text-[#BA1A6A]">{key}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
                  </div>
                  <code
                    className="text-xs px-3 py-1.5 rounded-lg text-slate-300 shrink-0 max-w-[200px] truncate"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {value}
                  </code>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card p-6"
          >
            <p className="section-heading text-sm font-display">Tech Stack</p>
            <div className="grid grid-cols-2 gap-2.5 text-sm">
              {[
                ['React', '18.3'],   ['Vite', '5.3'],
                ['TailwindCSS', '3.4'], ['Recharts', '2.12'],
                ['Framer Motion', '11.2'], ['Zustand', '4.5'],
                ['Axios', '1.7'], ['TypeScript', '5.4'],
              ].map(([name, version]) => (
                <motion.div
                  key={name}
                  whileHover={{ y: -1, transition: { duration: 0.2 } }}
                  className="flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 cursor-default"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span className="text-slate-300">{name}</span>
                  <span className="text-xs font-mono text-slate-600">v{version}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </PageWrapper>
    </>
  )
}
