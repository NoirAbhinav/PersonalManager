'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Cpu, Network, Zap, Brain } from 'lucide-react'
import { Github, Linkedin } from '@/components/Icons'

const projects = [
    {
        icon: Zap, color: 'green',
        title: 'Webhook Event Service',
        tech: ['Rust', 'Axum', 'Tokio', 'AWS EKS'],
        desc: 'High-performance webhook processor built in Rust/Axum capable of handling 20,000+ concurrent events/sec. Replaced a bottlenecked Python solution with zero downtime migration.',
        metric: { value: '20k+', label: 'events/sec' },
        github: 'https://github.com/NoirAbhinav',
    },
    {
        icon: Brain, color: 'amber',
        title: 'LLM-Powered IVR System',
        tech: ['FastAPI', 'OpenAI Whisper', 'Realtime API', 'SQLAlchemy'],
        desc: 'Production-grade voice AI system integrating OpenAI Whisper and Realtime API. Achieves end-to-end voice response latency of 150–200ms with Kamailio SIPS and RTPEngine on AWS EKS.',
        metric: { value: '150ms', label: 'voice latency' },
        github: 'https://github.com/NoirAbhinav',
    },
    {
        icon: Network, color: 'green',
        title: 'Cross-Language Pub/Sub Libraries',
        tech: ['Rust', 'pyO3', 'RabbitMQ', 'NATS'],
        desc: 'Authored pub/sub libraries for RabbitMQ and NATS using Rust + pyO3, enabling seamless Python/Rust interoperability. Adopted across 15+ internal services as the standard messaging layer.',
        metric: { value: '15+', label: 'services using it' },
        github: 'https://github.com/NoirAbhinav',
    },
    {
        icon: Cpu, color: 'amber',
        title: 'Campaign Manager Platform',
        tech: ['Django REST', 'PostgreSQL', 'Redis', 'RabbitMQ'],
        desc: 'Built from the ground up — cut campaign setup time from 10–20 minutes to under 2 minutes. Scaled to 500k+ active users on AWS with a generalized Redis-based task scheduler.',
        metric: { value: '500k+', label: 'active users' },
        github: 'https://github.com/NoirAbhinav',
    },
]

export default function Projects() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-80px' })

    return (
        <section id="projects">
            <div className="gradient-line" />
            <div className="section-container" ref={ref}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
                    <p className="section-label">// projects</p>
                    <h2 className="section-title">Things I've Built</h2>
                </motion.div>

                <div className="projects-grid">
                    {projects.map((p, i) => (
                        <motion.div key={p.title} initial={{ opacity: 0, y: 24 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`glass-card project-card ${p.color === 'green' ? 'glow-green' : 'glow-amber'}`}>
                            <div className="project-header">
                                <div className="project-title-row">
                                    <p.icon size={22} style={{ color: p.color === 'green' ? 'var(--color-green)' : 'var(--color-amber)', flexShrink: 0 }} />
                                    <span className="project-title">{p.title}</span>
                                </div>
                                <a href={p.github} target="_blank" rel="noopener noreferrer" className="project-link" aria-label="GitHub">
                                    <Github size={17} />
                                </a>
                            </div>
                            <p className="project-desc">{p.desc}</p>
                            <div className="project-footer">
                                <div className="project-tags">
                                    {p.tech.map((t) => (
                                        <span key={t} className={`project-tag ${p.color === 'green' ? 'project-tag-green' : 'project-tag-amber'}`}>{t}</span>
                                    ))}
                                </div>
                                <div className="project-metric">
                                    <div className="project-metric-value" style={{ color: p.color === 'green' ? 'var(--color-green)' : 'var(--color-amber)' }}>
                                        {p.metric.value}
                                    </div>
                                    <div className="project-metric-label">{p.metric.label}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}