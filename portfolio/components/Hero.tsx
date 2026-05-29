'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Mail, MapPin } from 'lucide-react'
import { Github, Linkedin } from '@/components/Icons'
import { track } from '@vercel/analytics'

const bootLines = [
  { text: '> Initializing system...', delay: 0 },
  { text: '> Loading profile: Abhinav Nair', delay: 400 },
  { text: '> Role: Senior Backend Engineer', delay: 800 },
  { text: '> Stack: Python · Rust · AWS · GenAI', delay: 1200 },
  { text: '> Status: Systems operational ✓', delay: 1600 },
]

const stack = [
  { label: 'Python',     color: 'green' },
  { label: 'Rust',       color: 'green' },
  { label: 'AWS',        color: 'amber' },
  { label: 'GenAI',      color: 'amber' },
  { label: 'FastAPI',    color: 'plain' },
  { label: 'Django',     color: 'plain' },
  { label: 'Docker',     color: 'plain' },
  { label: 'Kubernetes', color: 'plain' },
  { label: 'PostgreSQL', color: 'plain' },
]

const badgeStyle: Record<string, React.CSSProperties> = {
  green: { borderColor: 'rgba(0,255,136,0.25)', color: 'var(--color-green)', background: 'rgba(0,255,136,0.05)' },
  amber: { borderColor: 'rgba(255,179,0,0.25)',  color: 'var(--color-amber)', background: 'rgba(255,179,0,0.05)'  },
  plain: { borderColor: 'var(--color-border)',   color: 'var(--color-text-dim)', background: 'rgba(255,255,255,0.02)' },
}

export default function Hero() {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    bootLines.forEach((_, i) => setTimeout(() => setVisibleLines(i + 1), bootLines[i].delay))
    setTimeout(() => setShowContent(true), 2000)
  }, [])

  return (
    <section id="hero" className="hero-section">
      <div className="hero-radial" />

      <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Terminal boot */}
        <div className="boot-lines">
          <div className="terminal-bar">
            <span className="terminal-dot" style={{ background: '#ff5f56' }} />
            <span className="terminal-dot" style={{ background: '#ffbd2e' }} />
            <span className="terminal-dot" style={{ background: '#27c93f' }} />
            <span className="terminal-label">terminal</span>
          </div>
          {bootLines.map((line, i) => (
            <motion.p key={i} initial={{ opacity: 0, x: -8 }}
              animate={i < visibleLines ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.25 }}
              className={`boot-line${i === bootLines.length - 1 ? ' active' : ''}`}>
              {line.text}
              {i === visibleLines - 1 && !showContent && (
                <span className="animate-blink" style={{ color: 'var(--color-green)', marginLeft: 4 }}>█</span>
              )}
            </motion.p>
          ))}
        </div>

        {/* Main content */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}>

          <h1 className="hero-name">
            <span style={{ color: 'var(--color-text)' }}>Abhinav</span><br />
            <span className="text-green text-glow-green">Nair</span>
          </h1>

          {/* Role + location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <p className="hero-role" style={{ marginBottom: 0 }}>Senior Backend Engineer</p>
            <span style={{ color: 'var(--color-border-hl)', fontSize: '1.2rem' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-muted)', fontSize: '0.9rem' }}>
              <MapPin size={13} />
              Affinsys.ai · Bengaluru, IN
            </span>
          </div>

          {/* Tagline */}
          <p style={{
            borderLeft: '2px solid var(--color-green)',
            paddingLeft: 16,
            color: 'var(--color-text-dim)',
            fontSize: '1rem',
            fontStyle: 'italic',
            marginBottom: 28,
            lineHeight: 1.6,
          }}>
            Building calm, reliable systems behind chaotic workloads.
          </p>

          <p className="hero-desc">
            Building high-throughput distributed systems in Python &amp; Rust,
            serving 500k+ users across production microservice environments on AWS.
          </p>

          {/* Stack badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}>
            {stack.map((s) => (
              <span key={s.label} style={{
                padding: '6px 14px',
                borderRadius: 9999,
                border: '1px solid',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-family-mono)',
                transition: 'all 0.2s',
                ...badgeStyle[s.color],
              }}>
                {s.label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="hero-cta">
            <a href="/Abhinav_Nair_Resume.pdf" download className="btn-primary" onClick={() => track('resume_download', { location: 'hero' })}>
              Download Resume
            </a>
            <button className="btn-outline"
              onClick={() => {
                track('view_experience_click');
                document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' });
              }}>
              View Experience
            </button>
            <div className="hero-socials">
              <a href="https://github.com/NoirAbhinav" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub" onClick={() => track('social_click', { platform: 'github', location: 'hero' })}>
                <Github size={20} />
              </a>
              <a href="https://linkedin.com/in/abhinav-nair-n3747" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn" onClick={() => track('social_click', { platform: 'linkedin', location: 'hero' })}>
                <Linkedin size={20} />
              </a>
              <a href="mailto:abhinavbbps2000@gmail.com" className="social-link" aria-label="Email" onClick={() => track('social_click', { platform: 'email', location: 'hero' })}>
                <Mail size={20} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={showContent ? { opacity: 1 } : {}}
        transition={{ delay: 1 }} className="scroll-indicator">
        <ChevronDown size={24} />
      </motion.div>
    </section>
  )
}