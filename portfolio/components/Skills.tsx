'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Activity, Brain, Cloud, Code2, Database, Network, Server, Wrench } from 'lucide-react'

const categories = [
  { icon: Code2, title: 'Languages', color: 'green', skills: ['Python', 'Rust', 'C++', 'C', 'Java'] },
  { icon: Brain, title: 'AI / LLM', color: 'amber', skills: ['OpenAI APIs', 'Whisper', 'Realtime API', 'LangChain', 'Conversational AI', 'Prompt Engineering'] },
  { icon: Server, title: 'Backend & Frameworks', color: 'green', skills: ['FastAPI', 'Django', 'Django REST Framework', 'SQLAlchemy', 'Axum', 'Tokio'] },
  { icon: Network, title: 'Distributed Systems', color: 'amber', skills: ['RabbitMQ', 'NATS', 'Redis Streams', 'Event-Driven Architecture', 'Microservices'] },
  { icon: Database, title: 'Databases', color: 'green', skills: ['PostgreSQL', 'OracleDB', 'Redis'] },
  { icon: Cloud, title: 'Cloud & DevOps', color: 'blue', skills: ['AWS (EKS, EC2)', 'Azure', 'Docker', 'Kubernetes', 'GitHub Actions', 'Nginx'] },
  { icon: Activity, title: 'Observability & Testing', color: 'amber', skills: ['OpenTelemetry', 'pytest', 'unittest', 'k6', 'Locust', 'CI/CD'] },
  { icon: Wrench, title: 'Tools', color: 'blue', skills: ['Postman', 'DBeaver', 'Git/GitHub', 'Asterisk', 'Kamailio', 'RTPEngine'] },
]

const iconColor = { green: 'var(--color-green)', amber: 'var(--color-amber)', blue: 'var(--color-blue)' }
const glowClass = { green: 'glow-green', amber: 'glow-amber', blue: '' }

export default function Skills() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="skills">
      <div className="gradient-line" />
      <div className="section-container" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <p className="section-label">// skills</p>
          <h2 className="section-title">Tech Stack</h2>
        </motion.div>

        <div className="skills-grid">
          {categories.map((cat, i) => (
            <motion.div key={cat.title} initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`glass-card skill-card ${glowClass[cat.color as keyof typeof glowClass]}`}>
              <div className="skill-card-header">
                <cat.icon size={20} style={{ color: iconColor[cat.color as keyof typeof iconColor] }} />
                <span className="skill-card-title">{cat.title}</span>
              </div>
              <div className="skill-tags">
                {cat.skills.map((s) => <span key={s} className="skill-pill">{s}</span>)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}