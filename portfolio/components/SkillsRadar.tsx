'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Loader2, AlertCircle, Code2, Server, Network, Cloud, Activity, Brain } from 'lucide-react'

// ─── Language graph data (from GitHub API) ───────────────
interface GitHubLang {
  name: string
  bytes: number
  percentage: number
}

const LANG_COLORS: Record<string, string> = {
  Python:     '#3776ab',
  Rust:       '#ce4a00',
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Go:         '#00add8',
  PHP:        '#777bb4',
  'C++':      '#f34b7d',
  C:          '#555555',
  Java:       '#b07219',
}

// ─── Proficiency data (manually curated) ─────────────────
interface Skill { name: string; level: number } // level 1-5

const CATEGORIES = [
  {
    icon: Code2,
    label: 'Languages',
    color: 'green' as const,
    skills: [
      { name: 'Python', level: 5 },
      { name: 'Rust',   level: 4 },
      { name: 'GO',    level: 3 },
    ],
  },
  {
    icon: Server,
    label: 'Backend & Frameworks',
    color: 'green' as const,
    skills: [
      { name: 'FastAPI',  level: 5 },
      { name: 'Django',   level: 5 },
      { name: 'Axum',     level: 4 },
      { name: 'SQLAlchemy', level: 4 },
      { name: 'Gin', level: 3 },
    ],
  },
  {
    icon: Network,
    label: 'Messaging & Databases',
    color: 'amber' as const,
    skills: [
      { name: 'RabbitMQ',     level: 5 },
      { name: 'NATS',         level: 4 },
      { name: 'Redis', level: 5 },
      { name: 'Microservices', level: 5 },
      { name: 'PostgreSQL',   level: 4 },
    ],
  },
  {
    icon: Brain,
    label: 'AI / LLM',
    color: 'amber' as const,
    skills: [
      { name: 'OpenAI APIs',    level: 4 },
      { name: 'Whisper',        level: 4 },
      { name: 'LangChain',      level: 4 },
      { name: 'Prompt Engineering', level: 4 },
    ],
  },
  {
    icon: Cloud,
    label: 'Cloud & DevOps',
    color: 'blue' as const,
    skills: [
      { name: 'AWS EKS',         level: 4 },
      { name: 'Docker',          level: 5 },
      { name: 'GitHub Actions',  level: 4 },
      { name: 'Kubernetes',      level: 3 },
    ],
  },
  {
    icon: Activity,
    label: 'Observability & Testing',
    color: 'blue' as const,
    skills: [
      { name: 'OpenTelemetry', level: 4 },
      { name: 'pytest',        level: 5 },
      { name: 'k6 / Locust',  level: 4 },
      { name: 'CI/CD',         level: 4 },
    ],
  },
]

const LEVEL_LABELS = ['', 'Beginner', 'Familiar', 'Proficient', 'Advanced', 'Expert']

const colorVars = {
  green: 'var(--color-green)',
  amber: 'var(--color-amber)',
  blue:  'var(--color-blue)',
}

const colorAlpha = {
  green: 'rgba(0,255,136,0.12)',
  amber: 'rgba(255,179,0,0.12)',
  blue:  'rgba(121,184,255,0.12)',
}

// ─── Proficiency dots component ───────────────────────────
function ProficiencyDots({ level, color }: { level: number; color: 'green' | 'amber' | 'blue' }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: i < level ? colorVars[color] : 'var(--color-border)',
          boxShadow: i < level ? `0 0 4px ${colorVars[color]}` : 'none',
          transition: 'background 0.2s',
        }} />
      ))}
    </div>
  )
}

export default function SkillsRadar() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const [langs, setLangs]     = useState<GitHubLang[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const SHOW_GITHUB_LANGUAGES = true


  {SHOW_GITHUB_LANGUAGES && useEffect(() => {
    fetch('/api/languages')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((json: { languages: GitHubLang[] } | { error: string }) => {
        if ('error' in json) throw new Error(json.error)
        setLangs(json.languages.filter(l => l.percentage > 0))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])}

  const totalBytes = langs.reduce((s, l) => s + l.bytes, 0)
  return (
    <section id="skills">
      <div className="gradient-line" />
      <div className="section-container" ref={ref}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <p className="section-label">// skills</p>
          <h2 className="section-title">Tech Stack</h2>
        </motion.div>

        ── LANGUAGE GRAPH ───────────────────────────────
        {SHOW_GITHUB_LANGUAGES && <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ marginBottom: 64 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)' }}>
              Languages — from GitHub
            </p>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)' }}>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-green)' }} />
                fetching...
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {!loading && !error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--color-green)', fontFamily: 'var(--font-family-mono)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)', boxShadow: '0 0 6px rgba(0,255,136,0.8)', display: 'inline-block' }} />
                live data
              </div>
            )}
            {!loading && error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--color-amber)', fontFamily: 'var(--font-family-mono)' }}>
                <AlertCircle size={11} /> unavailable
              </div>
            )}
          </div>

          {/* Language bar */}
          {langs.length > 0 && (
            <>
              <div style={{ display: 'flex', height: 10, borderRadius: 9999, overflow: 'hidden', gap: 2, marginBottom: 16 }}>
                {langs.map((lang, i) => (
                  <motion.div
                    key={lang.name}
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${lang.percentage}%` } : {}}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
                    onMouseEnter={() => setHovered(lang.name)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      height: '100%',
                      background: LANG_COLORS[lang.name] ?? '#888',
                      borderRadius: 9999,
                      cursor: 'pointer',
                      opacity: hovered && hovered !== lang.name ? 0.4 : 1,
                      transition: 'opacity 0.2s',
                      boxShadow: hovered === lang.name ? `0 0 8px ${LANG_COLORS[lang.name] ?? '#888'}` : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                {langs.map(lang => (
                  <div
                    key={lang.name}
                    onMouseEnter={() => setHovered(lang.name)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      cursor: 'pointer',
                      opacity: hovered && hovered !== lang.name ? 0.4 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: LANG_COLORS[lang.name] ?? '#888', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-family-mono)', color: hovered === lang.name ? 'var(--color-text)' : 'var(--color-text-dim)' }}>
                      {lang.name}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontFamily: 'var(--font-family-mono)' }}>
                      {lang.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div style={{ height: 10, borderRadius: 9999, background: 'var(--color-border)', animation: 'pulse 1.5s ease-in-out infinite' }}>
              <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}`}</style>
            </div>
          )}
        </motion.div>}

        ── PROFICIENCY GRID ──────────────────────────────
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-family-mono)', marginBottom: 24 }}>
            Proficiency by category
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {CATEGORIES.map((cat, ci) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + ci * 0.08 }}
                className="glass-card"
                style={{ padding: 24 }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{
                    padding: 8, borderRadius: 10,
                    background: colorAlpha[cat.color],
                    border: `1px solid ${colorVars[cat.color]}22`,
                    display: 'flex',
                  }}>
                    <cat.icon size={16} style={{ color: colorVars[cat.color] }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-family-sans)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                    {cat.label}
                  </span>
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cat.skills.map((skill, si) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.3, delay: 0.4 + ci * 0.08 + si * 0.04 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-dim)', whiteSpace: 'nowrap' }}>
                          {skill.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', fontFamily: 'var(--font-family-mono)', width: 64, textAlign: 'right' }}>
                          {LEVEL_LABELS[skill.level]}
                        </span>
                        <ProficiencyDots level={skill.level} color={cat.color} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}