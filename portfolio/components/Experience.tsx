'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Briefcase, Calendar } from 'lucide-react'

const roles = [
  {
    title: 'Senior Software Engineer (Backend)',
    period: 'July 2025 – Present',
    bullets: [
      'Lead backend architecture for **5 distributed microservices** in Python (FastAPI, Django) and Rust (Axum), deployed on AWS EKS with PostgreSQL and Redis.',
      'Built a high-performance **Webhook Event Service in Rust/Axum** capable of processing **20,000+ concurrent events/sec**, replacing a bottlenecked Python-based solution.',
      'Scaled real-time IVR infrastructure using **Kamailio SIPS and RTPEngine** on AWS EKS; engineered a custom Python autoscaling worker that **reduced idle instance cost by 25%** and handled **250+ concurrent calls**.',
      'Improved system reliability by building **CI/CD pipelines** with GitHub Actions, integrating **OpenTelemetry observability**, and enforcing test coverage — **reducing production incidents by 40%**.',
      'Led a cross-functional team of **7–8 engineers** across sprint planning, architecture reviews, code reviews, and production deployments — **shipping 10+ major features** over 3 months.',
    ],
  },
  {
    title: 'Software Engineer (Backend)',
    period: 'July 2023 – July 2025',
    bullets: [
      'Engineered a **Campaign Manager platform** (Django REST Framework, PostgreSQL/OracleDB, Redis, RabbitMQ) from ground up, cutting setup time from **10-20 mins to under 2 minutes** and scaling to **500k+ active users**.',
      'Designed a **generalized Task Scheduler** using Redis event streams to automate time-based operations across **5+ services**, eliminating manual cron dependencies and **reducing scheduling latency by 300ms**.',
      'Authored cross-language **pub/sub libraries for RabbitMQ and NATS** using Rust + pyO3, enabling seamless Python/Rust interoperability and adopted across **15+ internal services**.',
      'Built a production **LLM-powered IVR and live calling system** integrating OpenAI Whisper and Realtime API via FastAPI/SQLAlchemy, achieving **end-to-end voice response latency of 150-200ms**.',
      'Authored **70+ unit, integration, and functional tests** with full GitHub Actions automation, achieving **95% code coverage** across core services.',
    ],
  },
  {
    title: 'Software Engineer Intern',
    period: 'October 2022 – July 2023',
    bullets: [
      'Contributed to the Campaign Manager backend (Django REST Framework), building **personalization features powered by LLMs** that **reduced marketing team workload by 65%** and **boosted user conversion by 30–42%**.',
      'Executed a full **NoSQL to SQL migration** from MongoDB to PostgreSQL/OracleDB, improving query performance and enabling relational analytics across campaign data.',
    ],
  },
]

function Bullet({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return (
    <li className="role-bullet">
      <span className="bullet-arrow">▹</span>
      <span>
        {parts.map((p, i) =>
          i % 2 === 1
            ? <span key={i} className="text-green fw-semi">{p}</span>
            : <span key={i}>{p}</span>
        )}
      </span>
    </li>
  )
}

export default function Experience() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="experience">
      <div className="gradient-line" />
      <div className="section-container" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <p className="section-label">// experience</p>
          <h2 className="section-title">Work Experience</h2>
          <p className="section-subtitle">@ Affinsys.ai — Building conversational AI infrastructure</p>
        </motion.div>

        <div className="timeline" style={{ marginTop: 48 }}>
          <div className="timeline-line" />
          <div className="timeline-items">
            {roles.map((role, i) => (
              <motion.div key={role.title} initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="timeline-item">
                <div className="timeline-dot">
                  <Briefcase size={16} />
                </div>
                <div className="glass-card role-card">
                  <div className="role-header">
                    <h3 className="role-title">{role.title}</h3>
                    <div className="role-period">
                      <Calendar size={13} />
                      {role.period}
                    </div>
                  </div>
                  <ul className="role-bullets">
                    {role.bullets.map((b, j) => <Bullet key={j} text={b} />)}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Education */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}>
          <p className="section-label" style={{ marginTop: 64 }}>// education</p>
          <div className="edu-grid">
            <div className="glass-card edu-card">
              <div className="edu-degree">B.Tech Computer Science &amp; Engineering</div>
              <div className="edu-school">Vellore Institute of Technology</div>
              <div className="edu-meta">2019 – 2023 · CGPA: <span className="text-green">8.63</span></div>
            </div>
            <div className="glass-card edu-card">
              <div className="edu-degree">PCM with Computer Science</div>
              <div className="edu-school">Bal Bharati Public School, Noida</div>
              <div className="edu-meta">2017 – 2019 · Percentage: <span className="text-green">95.4%</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}