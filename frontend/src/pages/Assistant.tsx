/**
 * NeuroOps AI — AI Ops Assistant
 * Context-aware conversational chatbot with live metrics, alert awareness,
 * and ML prediction context. Full enterprise chatbot UI.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Bot, User, Sparkles, Zap, Cpu, MemoryStick,
  HardDrive, Radio, Trash2, Copy, Check, ChevronRight, Activity,
  ShieldAlert, TrendingUp, AlertTriangle, BrainCircuit,
} from 'lucide-react'
import { Header }      from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { aiApi }       from '@/api/endpoints/ai'
import { useMetrics }  from '@/hooks/useMetrics'
import { useAlerts }   from '@/hooks/useAlerts'
import { fmt }         from '@/utils/formatters'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  contextUsed?: string[]
  isError?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

/** Minimal markdown → JSX: bold, inline code, bullet lists */
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, idx) => {
    const isBullet = /^[-•*]\s/.test(line.trimStart())
    const processed = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-800 text-violet-300 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')

    if (isBullet) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 ml-1">
          <span className="w-1 h-1 rounded-full bg-[#BA1A6A] mt-2 flex-shrink-0" />
          <span dangerouslySetInnerHTML={{ __html: processed.replace(/^[-•*]\s/, '') }} />
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={idx} className="h-2" />)
    } else {
      elements.push(
        <p key={idx} dangerouslySetInnerHTML={{ __html: processed }} />
      )
    }
  })

  return <div className="space-y-0.5 text-xs leading-relaxed" style={{ color: '#d0d0e0' }}>{elements}</div>
}

// ─────────────────────────────────────────────────────────────────────────────
// Context badge (shows which data sources were used)
// ─────────────────────────────────────────────────────────────────────────────

const CTX_LABELS: Record<string, { label: string; color: string }> = {
  live_metrics: { label: 'Metrics',     color: 'text-[#F2EFE7] bg-white/5 border-white/10'       },
  alerts:       { label: 'Alerts',      color: 'text-amber-400 bg-amber-500/10 border-amber-500/25'        },
  predictions:  { label: 'Predictions', color: 'text-[#BA1A6A] bg-[#8B004A]/10 border-[#8B004A]/25'     },
}

function ContextBadges({ sources }: { sources: string[] }) {
  if (!sources.length) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {sources.map(s => {
        const meta = CTX_LABELS[s]
        if (!meta) return null
        return (
          <span key={s} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold ${meta.color}`}>
            <Zap size={7} />
            {meta.label}
          </span>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat message bubble
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse ml-auto max-w-[82%]' : 'mr-auto max-w-[88%]'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border ${
        isUser
          ? 'bg-white/5 border-white/10 text-white'
          : 'bg-[#8B004A]/15 border-[#8B004A]/30 text-[#BA1A6A]'
      }`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-1">
        <div className={`px-4 py-3 rounded-2xl relative group ${
          isUser
            ? 'rounded-tr-sm'
            : msg.isError
              ? 'rounded-tl-sm'
              : 'rounded-tl-sm'
        }`}
          style={isUser ? {
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          } : msg.isError ? {
            background: 'rgba(244, 63, 94, 0.06)',
            border: '1px solid rgba(244, 63, 94, 0.15)',
          } : {
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {isUser
            ? <p className="text-xs leading-relaxed">{msg.content}</p>
            : renderMarkdown(msg.content)
          }

          {/* Copy button — assistant only */}
          {!isUser && (
            <button
              onClick={copy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 rounded-md" style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} className="text-slate-500" />}
            </button>
          )}
        </div>

        {/* Context + timestamp */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && msg.contextUsed && <ContextBadges sources={msg.contextUsed} />}
          <span className="text-[9px] text-slate-600 flex-shrink-0">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Typing indicator
// ─────────────────────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex gap-3 mr-auto"
    >
      <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(139,0,74,0.12)', border: '1px solid rgba(139,0,74,0.2)' }}>
        <Bot size={14} className="text-[#BA1A6A]" />
      </div>
      <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#BA1A6A]"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Live metrics mini-panel (sidebar)
// ─────────────────────────────────────────────────────────────────────────────

function LiveMetricsPanel() {
  const { current } = useMetrics()
  const { data: alertsData } = useAlerts(3000)
  const activeCount = alertsData?.alerts.filter(a => a.status === 'active').length ?? 0

  if (!current) {
    return (
      <div className="card p-4 space-y-2 animate-pulse">
        {[0,1,2].map(i => <div key={i} className="h-6 bg-slate-800 rounded" />)}
      </div>
    )
  }

  const metrics = [
    { label: 'CPU',    value: current.cpu.percent,    icon: Cpu,        color: '#BA1A6A' },
    { label: 'Memory', value: current.memory.percent, icon: MemoryStick,color: '#8B004A' },
    { label: 'Disk',   value: current.disk.percent,   icon: HardDrive,  color: '#f59e0b' },
  ]

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Live Context</p>
        <span className="flex items-center gap-1 text-[9px] text-emerald-400">
          <span className="live-dot scale-75" /> Live
        </span>
      </div>

      {metrics.map(({ label, value, icon: Icon, color }) => (
        <div key={label}>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Icon size={10} style={{ color }} />
              {label}
            </span>
            <span className="font-bold text-white">{fmt.percent(value)}</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${value}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      ))}

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
        <span className="text-slate-500">Active Alerts</span>
        <span className={`font-bold ${activeCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {activeCount > 0 ? `${activeCount} active` : 'None'}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion chips
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: Cpu,          label: 'CPU analysis',       text: 'Why is CPU usage high? What processes might be causing it?' },
  { icon: MemoryStick,  label: 'Memory health',      text: 'Analyse memory usage. Are there signs of a memory leak?' },
  { icon: TrendingUp,   label: 'Trend forecast',     text: 'What do the ML predictions say about future system load?' },
  { icon: AlertTriangle,label: 'Alert breakdown',    text: 'Explain the current active alerts and how to resolve them.' },
  { icon: ShieldAlert,  label: 'Anomalies',          text: 'Are there any suspicious patterns or anomalies detected?' },
  { icon: Activity,     label: 'Optimize perf',      text: 'What are the top 3 performance optimizations I should apply right now?' },
  { icon: HardDrive,    label: 'Disk status',        text: 'How is disk usage looking and when should I be concerned?' },
  { icon: BrainCircuit, label: 'Stability score',    text: 'What is my current stability score and what is driving it?' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const GREETING: Message = {
  id: 'init',
  role: 'assistant',
  content: `Hello! I'm **NeuroOps Copilot** — your AI SRE assistant with live access to your system telemetry.

I can see your real-time **CPU, memory, and disk metrics**, **active alerts**, and **ML-generated predictions** right now.

Ask me anything: *"Why is CPU high?"*, *"Explain this alert"*, *"What does my trend forecast say?"*, or *"How can I optimize performance?"*`,
  timestamp: new Date(),
  contextUsed: [],
}

export function Assistant() {
  const [messages, setMessages]       = useState<Message[]>([GREETING])
  const [input, setInput]             = useState('')
  const [sending, setSending]         = useState(false)
  const [showSuggestions, setShow]    = useState(true)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setShow(false)
    setInput('')
    setSending(true)

    const userMsg: Message = { id: uid(), role: 'user', content: trimmed, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])

    // Build history for API (exclude greeting, last 20 only)
    const historyPayload = messages
      .filter(m => m.id !== 'init')
      .slice(-20)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    try {
      const result = await aiApi.chatV2(trimmed, historyPayload)
      setMessages(prev => [...prev, {
        id: uid(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        contextUsed: result.context_used ?? [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: uid(),
        role: 'assistant',
        content: '⚠️ Failed to reach the backend. Check that the FastAPI server is running and the API key is configured.',
        timestamp: new Date(),
        isError: true,
      }])
    } finally {
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, sending])

  const clearChat = () => {
    setMessages([GREETING])
    setShow(true)
  }

  const hasConversation = messages.length > 1

  return (
    <>
      <Header title="AI Assistant" subtitle="Context-aware DevOps Copilot — live metrics · alerts · predictions" />
      <PageWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" style={{ height: 'calc(100vh - 168px)', minHeight: 540 }}>

          {/* ── Left: Chat window ─────────────────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col overflow-hidden rounded-2xl" style={{ background: 'rgba(10,10,32,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>

            {/* Chat header */}
            <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,0,74,0.15)', border: '1px solid rgba(139,0,74,0.2)' }}>
                    <Bot size={16} className="text-[#BA1A6A]" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-display">NeuroOps Copilot</p>
                  <p className="text-[10px] text-slate-500">Metrics · Alerts · Predictions context active</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <Radio size={10} className="animate-pulse" /> Live context
                </span>
                {hasConversation && (
                  <button
                    onClick={clearChat}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400 transition px-2 py-1 rounded-lg hover:bg-rose-500/10"
                  >
                    <Trash2 size={10} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <AnimatePresence initial={false}>
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                {sending && <TypingIndicator key="typing" />}
              </AnimatePresence>

              {/* Suggestion chips — show below greeting */}
              {showSuggestions && !sending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-2"
                >
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-3">Quick questions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTIONS.slice(0, 6).map((s, i) => {
                      const Icon = s.icon
                      return (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.35 + i * 0.05 }}
                          onClick={() => handleSend(s.text)}
                          className="flex items-center gap-2 p-3.5 rounded-xl text-left transition-all duration-200 group text-[11px] text-slate-400 hover:text-white"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.04)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(139,0,74,0.2)'
                            e.currentTarget.style.background = 'rgba(139,0,74,0.04)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                          }}
                        >
                          <Icon size={12} className="text-slate-500 group-hover:text-[#BA1A6A] transition flex-shrink-0" />
                          <span className="font-medium">{s.label}</span>
                          <ChevronRight size={10} className="ml-auto text-slate-600 group-hover:text-[#BA1A6A] transition" />
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <form onSubmit={e => { e.preventDefault(); handleSend(input) }} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask about CPU spikes, memory leaks, alerts, predictions…"
                    disabled={sending}
                    className="input-base pr-10 disabled:opacity-60"
                    style={{ background: 'rgba(10,10,32,0.6)' }}
                  />
                  {input && (
                    <button
                      type="button"
                      onClick={() => setInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition text-xs"
                    >✕</button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #BA1A6A, #8B004A)',
                    boxShadow: input.trim() ? '0 0 16px rgba(139, 0, 74, 0.4)' : 'none',
                  }}
                >
                  <Send size={13} />
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </form>
            </div>
          </div>

          {/* ── Right: Sidebar ──────────────────────────────────────────── */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">

            {/* Live metrics */}
            <LiveMetricsPanel />

            {/* More quick prompts */}
            <div className="card p-5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
                <Sparkles size={10} className="text-[#BA1A6A]" /> Suggested Questions
              </p>
              <div className="space-y-1.5">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={i}
                      onClick={() => handleSend(s.text)}
                      disabled={sending}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left border border-transparent transition-all duration-200 text-[11px] text-slate-500 hover:text-white disabled:opacity-50 group"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139,0,74,0.04)'
                        e.currentTarget.style.borderColor = 'rgba(139,0,74,0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = 'transparent'
                      }}
                    >
                      <Icon size={11} className="text-slate-600 group-hover:text-[#BA1A6A] transition flex-shrink-0" />
                      <span className="font-medium">{s.label}</span>
                      <ChevronRight size={9} className="ml-auto text-slate-700 group-hover:text-[#BA1A6A] transition" />
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </PageWrapper>
    </>
  )
}
