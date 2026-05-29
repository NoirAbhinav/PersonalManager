'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Terminal } from 'lucide-react'

const COMMANDS: Record<string, () => string | string[]> = {
  help: () => [
    'Available commands:',
    '  about        — Who is Abhinav?',
    '  skills       — Tech stack',
    '  experience   — Work history',
    '  contact      — Get in touch',
    '  projects     — Things built',
    '  stack        — Current toolbox',
    '  status       — System status',
    '  clear        — Clear terminal',
    '  exit         — Close terminal',
  ],
  about: () => [
    'Abhinav Nair — Senior Backend Engineer',
    'Location: Bengaluru, India',
    'Company: Affinsys.ai',
    'Focus: Distributed systems, Rust, Python, GenAI',
    '3 years building infrastructure that scales.',
  ],
  skills: () => [
    'Languages:  Python · Rust · C++ · Java',
    'Backend:    FastAPI · Django · Axum · SQLAlchemy',
    'Messaging:  RabbitMQ · NATS · Redis Streams',
    'Cloud:      AWS EKS · Docker · Kubernetes',
    'AI/LLM:     OpenAI · Whisper · Realtime API · LangChain',
    'Databases:  PostgreSQL · OracleDB · Redis',
  ],
  experience: () => [
    '[ Affinsys.ai ]',
    '  Senior Software Engineer  Jul 2025 – Present',
    '  Software Engineer         Jul 2023 – Jul 2025',
    '  Intern                    Oct 2022 – Jul 2023',
    '',
    'Highlights:',
    '  → 20,000+ events/sec webhook service in Rust',
    '  → 500k+ users on Campaign Manager',
    '  → 150ms voice latency on LLM IVR system',
    '  → 25% infra cost reduction via autoscaling',
  ],
  projects: () => [
    '1. Webhook Event Service     [Rust/Axum]   20k events/sec',
    '2. LLM-Powered IVR System    [FastAPI]     150ms latency',
    '3. Cross-Language Pub/Sub    [Rust+pyO3]   15+ services',
    '4. Campaign Manager          [Django]      500k+ users',
  ],
  contact: () => [
    'Email:    abhinavbbps2000@gmail.com',
    'GitHub:   github.com/NoirAbhinav',
    'LinkedIn: linkedin.com/in/abhinav-nair-n3747',
    'Phone:    +91 78275 98718',
  ],
  stack: () => [
    'Daily drivers:',
    '  Editor:    VS Code + rust-analyzer',
    '  Shell:     zsh + tmux',
    '  DB client: DBeaver',
    '  API:       Postman',
    '  Infra:     AWS EKS + GitHub Actions',
  ],
  status: () => [
    'SYSTEM STATUS',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '  Portfolio:    ██████████  ONLINE',
    '  Backend APIs: ██████████  OPERATIONAL',
    '  Coffee level: ███░░░░░░░  LOW — refilling',
    '  Open to work: ██████████  YES',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ],
  whoami: () => ['abhinav — senior backend engineer'],
  ls: () => ['about/  experience/  skills/  projects/  blog/  contact/'],
  pwd: () => ['/home/abhinav/portfolio'],
  date: () => [new Date().toString()],
  uname: () => ['AbhinavOS 3.0.0 LTS — Powered by Rust & Caffeine'],
}

interface Line {
  type: 'input' | 'output' | 'error'
  text: string
}

const INITIAL_LINES: Line[] = [
  { type: 'output', text: 'AbhinavOS v3.0.0 — Interactive Portfolio Terminal' },
  { type: 'output', text: 'Type "help" to see available commands.' },
  { type: 'output', text: '' },
]

export default function TerminalEasterEgg() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<Line[]>(INITIAL_LINES)
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [buffer, setBuffer] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Global keypress listener — type 'help' anywhere to open
  useEffect(() => {
    let typed = ''
    const handler = (e: KeyboardEvent) => {
      if (open) return
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key.length === 1) {
        typed += e.key.toLowerCase()
        if (typed.endsWith('help')) { setOpen(true); typed = '' }
        if (typed.length > 20) typed = typed.slice(-20)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()
    const newLines: Line[] = [...lines, { type: 'input', text: `$ ${cmd}` }]

    if (!trimmed) {
      setLines([...newLines])
      return
    }

    if (trimmed === 'exit') { setOpen(false); return }
    if (trimmed === 'clear') { setLines(INITIAL_LINES); return }

    const fn = COMMANDS[trimmed]
    if (fn) {
      const result = fn()
      const outputs = Array.isArray(result) ? result : [result]
      outputs.forEach(t => newLines.push({ type: 'output', text: t }))
    } else {
      newLines.push({ type: 'error', text: `command not found: ${trimmed}. Type "help" for commands.` })
    }

    setLines(newLines)
    setHistory(prev => [cmd, ...prev.slice(0, 49)])
    setHistoryIdx(-1)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIdx === -1) setBuffer(input)
      const next = Math.min(historyIdx + 1, history.length - 1)
      setHistoryIdx(next)
      setInput(history[next] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = historyIdx - 1
      if (next < 0) { setHistoryIdx(-1); setInput(buffer) }
      else { setHistoryIdx(next); setInput(history[next]) }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const lineColor = (type: Line['type']) => {
    if (type === 'input') return 'var(--color-green)'
    if (type === 'error') return '#ff5555'
    return 'var(--color-text-dim)'
  }

  return (
    <>
      {/* Hint shown on desktop */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        background: 'rgba(17,17,17,0.8)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        fontSize: '0.72rem',
        color: 'var(--color-muted)',
        fontFamily: 'var(--font-family-mono)',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, color 0.2s',
      }}
        onClick={() => setOpen(true)}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--color-green)'
          e.currentTarget.style.color = 'var(--color-green)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.color = 'var(--color-muted)'
        }}
      >
        <Terminal size={12} />
        type <span style={{ color: 'var(--color-green)', margin: '0 2px' }}>help</span> or click
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />

            {/* Terminal window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'fixed', zIndex: 999,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(720px, 92vw)',
                maxHeight: '70vh',
                background: 'rgba(10,10,10,0.97)',
                border: '1px solid var(--color-border)',
                borderRadius: 16,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,136,0.05)',
              }}
              onClick={() => inputRef.current?.focus()}
            >
              {/* Title bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border)',
                background: 'rgba(17,17,17,0.8)',
                flexShrink: 0,
              }}>
                <button onClick={(e) => { e.stopPropagation(); setOpen(false) }}
                  style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56', border: 'none', cursor: 'pointer' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
                <span style={{ flex: 1, textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)', marginRight: 28 }}>
                  abhinav@portfolio — terminal
                </span>
                <button onClick={(e) => { e.stopPropagation(); setOpen(false) }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', display: 'flex', marginLeft: 'auto' }}>
                  <X size={15} />
                </button>
              </div>

              {/* Output */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px 20px',
                fontFamily: 'var(--font-family-mono)', fontSize: '0.85rem', lineHeight: 1.7,
              }}>
                {lines.map((line, i) => (
                  <div key={i} style={{ color: lineColor(line.type), whiteSpace: 'pre' }}>
                    {line.text || '\u00A0'}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 20px',
                borderTop: '1px solid var(--color-border)',
                background: 'rgba(17,17,17,0.5)',
                flexShrink: 0,
              }}>
                <span style={{ color: 'var(--color-green)', fontFamily: 'var(--font-family-mono)', fontSize: '0.85rem' }}>$</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: 'var(--color-green)', fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.85rem', caretColor: 'var(--color-green)',
                  }}
                  placeholder="type a command..."
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}