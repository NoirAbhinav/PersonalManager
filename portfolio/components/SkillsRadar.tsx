'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface Skill {
  label: string
  value: number // 0-100
  color: 'green' | 'amber' | 'blue'
}

const skills: Skill[] = [
  { label: 'Python',       value: 95, color: 'green' },
  { label: 'Rust',         value: 85, color: 'green' },
  { label: 'FastAPI',      value: 92, color: 'green' },
  { label: 'Django',       value: 88, color: 'green' },
  { label: 'PostgreSQL',   value: 85, color: 'blue'  },
  { label: 'Redis',        value: 82, color: 'blue'  },
  { label: 'RabbitMQ',     value: 88, color: 'amber' },
  { label: 'Kubernetes',   value: 75, color: 'amber' },
  { label: 'AWS',          value: 80, color: 'amber' },
  { label: 'OpenAI/LLMs',  value: 85, color: 'amber' },
]

const colorVars = {
  green: 'var(--color-green)',
  amber: 'var(--color-amber)',
  blue:  'var(--color-blue)',
}

const colorAlpha = {
  green: 'rgba(0,255,136,0.15)',
  amber: 'rgba(255,179,0,0.15)',
  blue:  'rgba(121,184,255,0.15)',
}

// Radar chart helpers
const N = skills.length
const CX = 200
const CY = 200
const R  = 150

function polar(angle: number, r: number) {
  const a = (angle - 90) * (Math.PI / 180)
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

function radarPath(values: number[]) {
  return values.map((v, i) => {
    const { x, y } = polar((360 / N) * i, (v / 100) * R)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ') + 'Z'
}

const rings = [20, 40, 60, 80, 100]

export default function SkillsRadar() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [hovered, setHovered] = useState<number | null>(null)

  const radarValues = skills.map(s => s.value)

  return (
    <section id="skills">
      <div className="gradient-line" />
      <div className="section-container" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <p className="section-label">// skills</p>
          <h2 className="section-title">Tech Stack</h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48, alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>

            {/* Radar SVG */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <svg viewBox="0 0 400 400" width="100%" style={{ maxWidth: 380 }}>
                {/* Grid rings */}
                {rings.map(r => (
                  <polygon key={r}
                    points={Array.from({ length: N }, (_, i) => {
                      const { x, y } = polar((360 / N) * i, (r / 100) * R)
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                ))}

                {/* Axis lines */}
                {skills.map((_, i) => {
                  const { x, y } = polar((360 / N) * i, R)
                  return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                })}

                {/* Filled radar area */}
                <motion.path
                  d={radarPath(radarValues)}
                  fill="rgba(0,255,136,0.08)"
                  stroke="rgba(0,255,136,0.5)"
                  strokeWidth="1.5"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 1, delay: 0.4 }}
                />

                {/* Data points */}
                {skills.map((skill, i) => {
                  const { x, y } = polar((360 / N) * i, (skill.value / 100) * R)
                  const isHov = hovered === i
                  return (
                    <motion.circle key={i} cx={x} cy={y}
                      r={isHov ? 7 : 4}
                      fill={isHov ? colorVars[skill.color] : 'var(--color-bg)'}
                      stroke={colorVars[skill.color]}
                      strokeWidth="2"
                      style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.05 }}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  )
                })}

                {/* Labels */}
                {skills.map((skill, i) => {
                  const { x, y } = polar((360 / N) * i, R + 28)
                  const isHov = hovered === i
                  return (
                    <text key={i} x={x} y={y}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="11"
                      fill={isHov ? colorVars[skill.color] : 'var(--color-text-dim)'}
                      fontFamily="var(--font-family-mono)"
                      style={{ transition: 'fill 0.15s', cursor: 'pointer' }}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {skill.label}
                    </text>
                  )
                })}

                {/* Center tooltip */}
                {hovered !== null && (
                  <g>
                    <text x={CX} y={CY - 10} textAnchor="middle"
                      fontSize="22" fontWeight="700"
                      fill={colorVars[skills[hovered].color]}
                      fontFamily="var(--font-family-sans)">
                      {skills[hovered].value}%
                    </text>
                    <text x={CX} y={CY + 14} textAnchor="middle"
                      fontSize="11" fill="var(--color-text-dim)"
                      fontFamily="var(--font-family-mono)">
                      {skills[hovered].label}
                    </text>
                  </g>
                )}
              </svg>
            </motion.div>

            {/* Skill bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {skills.map((skill, i) => (
                <motion.div key={skill.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                  style={{ cursor: 'default' }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-family-mono)',
                      color: hovered === i ? colorVars[skill.color] : 'var(--color-text-dim)',
                      transition: 'color 0.15s',
                    }}>
                      {skill.label}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family-mono)',
                      color: hovered === i ? colorVars[skill.color] : 'var(--color-muted)',
                      transition: 'color 0.15s',
                    }}>
                      {skill.value}%
                    </span>
                  </div>
                  <div style={{
                    height: 4, borderRadius: 9999,
                    background: 'var(--color-border)',
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${skill.value}%` } : {}}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.06, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        borderRadius: 9999,
                        background: hovered === i
                          ? colorVars[skill.color]
                          : `linear-gradient(90deg, ${colorVars[skill.color]}, ${colorAlpha[skill.color]})`,
                        boxShadow: hovered === i ? `0 0 8px ${colorVars[skill.color]}` : 'none',
                        transition: 'background 0.15s, box-shadow 0.15s',
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Extra skill pills below */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginBottom: 12, fontFamily: 'var(--font-family-mono)' }}>
              also familiar with:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['LangChain', 'OpenTelemetry', 'Kamailio', 'RTPEngine', 'Asterisk',
                'pytest', 'k6', 'Locust', 'Nginx', 'Azure', 'DBeaver', 'Tokio', 'pyO3'].map(s => (
                <span key={s} className="skill-pill">{s}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}