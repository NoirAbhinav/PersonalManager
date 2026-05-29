'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { X, Zap } from 'lucide-react'

const STATUS = {
  text: 'Currently building: Real-time observability pipeline with OpenTelemetry + Rust',
  link: null, // set to a URL string to make it clickable
}

export default function StatusBanner() {
  const [visible, setVisible] = useState(true)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ overflow: 'hidden', position: 'relative', zIndex: 60 }}
        >
          <div style={{
            background: 'linear-gradient(90deg, rgba(0,255,136,0.08), rgba(255,179,0,0.06), rgba(0,255,136,0.08))',
            borderBottom: '1px solid rgba(0,255,136,0.15)',
            padding: '9px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: '0.8rem',
            fontFamily: 'var(--font-family-mono)',
            position: 'relative',
          }}>
            {/* Animated pulse dot */}
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--color-green)',
                boxShadow: '0 0 8px rgba(0,255,136,0.8)',
                display: 'inline-block',
              }} />
              <motion.span
                animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--color-green)',
                  top: 0, left: 0,
                }}
              />
            </span>

            <Zap size={13} style={{ color: 'var(--color-green)', flexShrink: 0 }} />

            {STATUS.link ? (
              <a href={STATUS.link} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--color-text-dim)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-green)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-dim)')}>
                {STATUS.text}
              </a>
            ) : (
              <span style={{ color: 'var(--color-text-dim)' }}>{STATUS.text}</span>
            )}

            {/* Close button */}
            <button
              onClick={() => setVisible(false)}
              style={{
                position: 'absolute', right: 16,
                background: 'none', border: 'none',
                color: 'var(--color-muted)', cursor: 'pointer',
                display: 'flex', padding: 4, borderRadius: 4,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}