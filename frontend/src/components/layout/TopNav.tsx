/**
 * NeuroOps AI — Top Navigation Bar
 * Provides search, notifications, system status, and profile avatar.
 */
import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAlerts } from '@/hooks/useAlerts';

export function TopNav() {
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: alertsData, dismissAlert } = useAlerts(2000);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeAlerts = alertsData?.alerts.filter((a) => a.status === 'active') || [];
  const unread = activeAlerts.length;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-surface-card border-b border-surface-border glass-box relative z-50">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base w-64"
        />
      </div>

      {/* Right side: notifications, system status, profile */}
      <div className="flex items-center gap-4 relative">
        {/* Notifications */}
        <div ref={dropdownRef} className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-full hover:bg-surface-muted transition ${showNotifications ? 'bg-surface-muted text-white' : 'text-slate-400'}`}
          >
            <Bell className="w-5 h-5 text-slate-400 hover:text-white transition" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unread}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl p-4 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">Active Notifications</span>
                  <span className="text-[10px] text-slate-400 font-mono">{unread} active events</span>
                </div>

                {activeAlerts.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No active notifications. System is optimal.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {activeAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className="p-2 bg-slate-900/40 hover:bg-slate-900/80 rounded-lg border border-slate-800/40 flex items-start justify-between gap-2.5 transition"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            alert.severity === 'critical' ? 'text-rose-400 animate-pulse' :
                            alert.severity === 'warning' ? 'text-amber-400' : 'text-fuchsia-400'
                          }`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">{alert.title}</p>
                            <p className="text-[10px] text-slate-400 truncate">{alert.message}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => dismissAlert(alert.id)}
                          className="p-0.5 text-slate-500 hover:text-rose-400 rounded transition shrink-0"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-center">
                  <Link 
                    to="/alerts" 
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-brand-400 hover:text-white flex items-center gap-1 transition font-medium"
                  >
                    Open Alert Center <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* System status (live dot) */}
        <span className="live-dot" title="System online" />

        {/* Profile */}
        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-muted transition">
          <User className="w-5 h-5 text-slate-400" />
          <span className="hidden md:inline text-sm text-slate-200">Admin</span>
        </button>
      </div>
    </header>
  );
}
