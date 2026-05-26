'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Code2, Globe, Server, Zap } from 'lucide-react'

const strengths = [
  { icon: Server, title: 'Distributed Systems', desc: 'Event-driven architectures with RabbitMQ, NATS, and Redis Streams.', color: 'green' },
  { icon: Zap, title: 'High-Throughput APIs', desc: '20,000+ concurrent events/sec with Rust/Axum microservices.', color: 'amber' },
  { icon: Code2, title: 'Python & Rust', desc: 'FastAPI, Django, Axum — cross-language interop via pyO3.', color: 'green' },
  { icon: Globe, title: 'Conversational AI', desc: 'Production LLM-powered IVR with OpenAI Whisper & Realtime API.', color: 'amber' },
]

const tags = ['Distributed Systems', 'Event-Driven Architecture', 'Real-Time AI', 'High-Throughput APIs', 'Microservices', 'Observability']

export default function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [imgError, setImgError] = useState(false)

  return (
    <section id="about">
      <div className="gradient-line" />
      <div className="section-container" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <p className="section-label">// about</p>
          <h2 className="section-title">Who I Am</h2>
        </motion.div>

        <div className="about-bio">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }} className="glass-card glow-green about-photo-wrapper">
            <div className="about-photo">
              {!imgError ? (
                <img src="/profile.jpg" alt="Abhinav Nair" onError={() => setImgError(true)} />
              ) : (
                <div className="about-photo-fallback">
                  <span className="about-photo-initials">AN</span>
                  <span className="about-photo-hint">Add profile.jpg to /public</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }} className="about-text">
            <p>
              Senior Backend Engineer with <span className="text-green fw-semi">3 years</span> of experience
              building high-throughput distributed systems in <span className="text-amber">Python</span> and{' '}
              <span className="text-amber">Rust</span>, serving{' '}
              <span className="text-green fw-semi">500k+ users</span> across production microservice environments on AWS.
            </p>
            <p>
              Specialized in event-driven architectures, real-time communication systems,
              and Generative AI integrations using OpenAI Whisper and Realtime APIs.
              Proven track record of shipping at scale and leading engineering teams end-to-end.
            </p>
            <div className="about-tags">
              {tags.map((tag) => <span key={tag} className="skill-pill">{tag}</span>)}
            </div>
          </motion.div>
        </div>

        <div className="strengths-grid">
          {strengths.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className={`glass-card strength-card ${item.color === 'green' ? 'glow-green' : 'glow-amber'}`}>
              <div className="strength-icon">
                <item.icon size={26} style={{ color: item.color === 'green' ? 'var(--color-green)' : 'var(--color-amber)' }} />
              </div>
              <div className="strength-title">{item.title}</div>
              <div className="strength-desc">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}