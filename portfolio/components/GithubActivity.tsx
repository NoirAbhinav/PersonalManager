'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { GitCommit } from 'lucide-react'
import { Github } from '@/components/Icons'

interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

// Seeded PRNG — identical output on server and client
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// Fixed date — no Date.now() or new Date() without args
function generateMockData(): ContributionDay[] {
  const rand = seededRandom(42)
  const days: ContributionDay[] = []
  const start = new Date('2025-05-28') // fixed start, always same

  for (let i = 0; i < 365; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const r = rand()
    let count = 0

    if (isWeekend) {
      count = r < 0.5 ? 0 : r < 0.7 ? 1 : r < 0.85 ? 2 : 3
    } else {
      count = r < 0.15 ? 0 : r < 0.35 ? 1 : r < 0.6 ? 3 : r < 0.8 ? 5 : r < 0.92 ? 8 : 12
    }

    const level: 0 | 1 | 2 | 3 | 4 =
      count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 7 ? 3 : 4

    days.push({ date: dateStr, count, level })
  }
  return days
}

const CELL = 13
const GAP  = 3

const levelColor = ['#161616', 'rgba(0,255,136,0.2)', 'rgba(0,255,136,0.4)', 'rgba(0,255,136,0.65)', '#00ff88']
const levelGlow  = ['none', 'none', 'none', '0 0 4px rgba(0,255,136,0.3)', '0 0 8px rgba(0,255,136,0.5)']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['','Mon','','Wed','','Fri','']

// Pre-generate once at module level — same value server + client
const MOCK_DATA = generateMockData()

export default function GitHubActivity() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [tooltip, setTooltip] = useState<{ day: ContributionDay; x: number; y: number } | null>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (isInView) setTimeout(() => setAnimated(true), 300)
  }, [isInView])

  const data = MOCK_DATA

  // Group into weeks
  const weeks: (ContributionDay | null)[][] = []
  const firstDay = new Date(data[0].date).getDay()
  let week: (ContributionDay | null)[] = Array(firstDay).fill(null)
  data.forEach(day => {
    week.push(day)
    if (week.length === 7) { weeks.push(week); week = [] }
  })
  if (week.length) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  const totalContributions = data.reduce((s, d) => s + d.count, 0)
  const streak = (() => {
    let s = 0
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].count > 0) s++; else break
    }
    return s
  })()

  // Month labels
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((w, wi) => {
    const first = w.find(d => d !== null)
    if (first) {
      const m = new Date(first.date).getMonth()
      if (m !== lastMonth) { monthLabels.push({ label: MONTHS[m], col: wi }); lastMonth = m }
    }
  })

  return (
    <section id="github">
      <div className="gradient-line" />
      <div className="section-container" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <p className="section-label">// activity</p>
          <h2 className="section-title">GitHub Activity</h2>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}
        >
          {[
            { icon: GitCommit, label: 'Contributions (past year)', value: totalContributions.toLocaleString() },
            { icon: Github,    label: 'Current streak',            value: `${streak} days` },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px',
              background: 'rgba(17,17,17,0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
            }}>
              <s.icon size={16} style={{ color: 'var(--color-green)' }} />
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-sans)', color: 'var(--color-green)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontFamily: 'var(--font-family-mono)' }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(255,179,0,0.05)',
            border: '1px solid rgba(255,179,0,0.15)',
            borderRadius: 12,
            fontSize: '0.75rem',
            color: 'var(--color-amber)',
            fontFamily: 'var(--font-family-mono)',
            alignSelf: 'center',
          }}>
            ⚡ Data shown is illustrative — connect your GitHub token to show live data
          </div>
        </motion.div>

        {/* Heatmap */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ overflowX: 'auto', paddingBottom: 8 }}
        >
          <div style={{ position: 'relative', display: 'inline-block', minWidth: weeks.length * (CELL + GAP) + 32 }}>
            {/* Month labels */}
            <div style={{ display: 'flex', marginBottom: 4, marginLeft: 28, height: 16 }}>
              {monthLabels.map(({ label, col }) => (
                <div key={`${label}-${col}`} style={{
                  position: 'absolute',
                  left: 28 + col * (CELL + GAP),
                  fontSize: '0.7rem',
                  color: 'var(--color-muted)',
                  fontFamily: 'var(--font-family-mono)',
                }}>
                  {label}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: GAP, marginTop: 18 }}>
              {/* Day labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 4 }}>
                {DAYS.map((d, i) => (
                  <div key={i} style={{
                    height: CELL, fontSize: '0.65rem',
                    color: 'var(--color-muted)',
                    fontFamily: 'var(--font-family-mono)',
                    display: 'flex', alignItems: 'center',
                    width: 20,
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid */}
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                  {week.map((day, di) => (
                    <motion.div
                      key={di}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={animated ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.2, delay: wi * 0.008 + di * 0.003 }}
                      style={{
                        width: CELL, height: CELL,
                        borderRadius: 3,
                        background: day ? levelColor[day.level] : 'transparent',
                        boxShadow: day ? levelGlow[day.level] : 'none',
                        cursor: day ? 'pointer' : 'default',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                      }}
                      onMouseEnter={e => {
                        if (!day) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({ day, x: rect.left, y: rect.top })
                        e.currentTarget.style.transform = 'scale(1.3)'
                        e.currentTarget.style.boxShadow = `0 0 8px ${levelColor[day.level]}`
                      }}
                      onMouseLeave={e => {
                        setTooltip(null)
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = day ? levelGlow[day.level] : 'none'
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginTop: 12, justifyContent: 'flex-end',
          fontSize: '0.7rem', color: 'var(--color-muted)', fontFamily: 'var(--font-family-mono)',
        }}>
          <span>Less</span>
          {levelColor.map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: c, border: '1px solid rgba(255,255,255,0.05)' }} />
          ))}
          <span>More</span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'fixed',
            top: tooltip.y - 44,
            left: tooltip.x - 40,
            zIndex: 100,
            background: 'rgba(17,17,17,0.95)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-family-mono)',
            color: 'var(--color-text)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <span style={{ color: 'var(--color-green)', fontWeight: 700 }}>{tooltip.day.count}</span>
            {' contributions on '}
            {new Date(tooltip.day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}

        {/* Connect real data note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{
            marginTop: 24, padding: '16px 20px',
            background: 'rgba(17,17,17,0.4)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            fontSize: '0.8rem', color: 'var(--color-text-dim)',
            fontFamily: 'var(--font-family-mono)',
          }}
        >
          <span style={{ color: 'var(--color-green)' }}>{'>'}</span>
          {' To show live data: add '}
          <span style={{ color: 'var(--color-amber)' }}>GITHUB_TOKEN</span>
          {' to your Vercel env vars and replace '}
          <span style={{ color: 'var(--color-amber)' }}>MOCK_DATA</span>
          {' in GitHubActivity.tsx with a fetch to the GitHub GraphQL API.'}
        </motion.div>
      </div>
    </section>
  )
}