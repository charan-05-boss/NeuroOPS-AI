/**
 * NeuroOps AI — Spatial Navigation
 * A floating, glassmorphic navigation pill replacing the traditional sidebar.
 */
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Activity, Bell, Bot, Settings, TrendingUp, Zap } from 'lucide-react'

const items = [
  { name: 'Dashboard',    path: '/',            icon: Home       },
  { name: 'Analytics',    path: '/analytics',   icon: Activity   },
  { name: 'Predictions',  path: '/predictions', icon: TrendingUp },
  { name: 'Alerts',       path: '/alerts',      icon: Bell       },
  { name: 'Assistant',    path: '/assistant',   icon: Bot        },
  { name: 'Settings',     path: '/settings',    icon: Settings   },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
        className="flex items-center gap-2 p-2 rounded-full"
        style={{
          background: 'rgba(5, 5, 5, 0.65)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Brand Icon */}
        <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full ml-1 mr-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#8B004A] to-[#BA1A6A] rounded-full opacity-20 blur-md group-hover:opacity-40 transition-opacity" />
          <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-[#111111] border border-white/10 group-hover:border-[#BA1A6A]/50 transition-colors">
            <Zap size={14} className="text-[#F2EFE7]" />
          </div>
        </Link>

        <div className="w-[1px] h-6 bg-white/10 mr-2" />

        {/* Nav Items */}
        {items.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.name}
              to={item.path}
              className="relative px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium transition-colors duration-300 group"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              {!isActive && (
                <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-300" />
              )}

              <Icon
                size={16}
                className={`relative z-10 transition-colors duration-300 ${
                  isActive ? 'text-[#F2EFE7]' : 'text-neutral-500 group-hover:text-neutral-300'
                }`}
              />
              <span
                className={`relative z-10 transition-colors duration-300 font-display ${
                  isActive ? 'text-[#F2EFE7]' : 'text-neutral-500 group-hover:text-neutral-300'
                }`}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </motion.div>
    </div>
  )
}
