'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowUpRight, Clock } from 'lucide-react'

const posts = [
  {
    tag: 'Rust',
    date: 'Mar 2025',
    readTime: '8 min read',
    title: 'Building a 20k Events/sec Webhook Service in Rust',
    excerpt:
      'How I replaced a bottlenecked Python service with a Rust/Axum webhook processor. The architecture decisions, Tokio concurrency model, and the migration strategy that kept production running.',
    color: 'green',
  },
  {
    tag: 'GenAI',
    date: 'Jan 2025',
    readTime: '6 min read',
    title: 'Achieving 150ms Voice Latency with OpenAI Realtime API',
    excerpt:
      'A deep dive into building production LLM-powered IVR — from WebSocket streaming to Kamailio SIP routing, and every latency optimization that got us under 200ms end-to-end.',
    color: 'amber',
  },
  {
    tag: 'Systems',
    date: 'Oct 2024',
    readTime: '5 min read',
    title: 'Cross-Language Pub/Sub: Rust + Python via pyO3',
    excerpt:
      'Writing RabbitMQ and NATS libraries that work natively in both Rust and Python using pyO3 bindings — and why this pattern eliminated an entire category of serialization bugs across 15 services.',
    color: 'green',
  },
]

const tagColor: Record<string, string> = {
  green: 'rgba(0,255,136,0.06)',
  amber: 'rgba(255,179,0,0.06)',
}
const tagBorder: Record<string, string> = {
  green: 'rgba(0,255,136,0.25)',
  amber: 'rgba(255,179,0,0.25)',
}
const tagText: Record<string, string> = {
  green: 'var(--color-green)',
  amber: 'var(--color-amber)',
}

export default function Blog() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="blog">
      <div className="gradient-line" />
      <div className="section-container" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label">// writing</p>
          <h2 className="section-title">Technical Writing</h2>
        </motion.div>

        <div className="blog-grid">
          {posts.map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className={`glass-card blog-card ${post.color === 'green' ? 'glow-green' : 'glow-amber'}`}
            >
              <div className="blog-meta">
                <span
                  className="blog-tag"
                  style={{
                    background: tagColor[post.color],
                    borderColor: tagBorder[post.color],
                    color: tagText[post.color],
                  }}
                >
                  {post.tag}
                </span>
                <span className="blog-date">{post.date}</span>
              </div>

              <h3 className="blog-title">{post.title}</h3>
              <p className="blog-excerpt">{post.excerpt}</p>

              <div className="blog-footer">
                <span className="blog-read-time" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={12} />
                  {post.readTime}
                </span>
                <span className="blog-arrow">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            textAlign: 'center',
            marginTop: 32,
            fontSize: '0.82rem',
            color: 'var(--color-muted)',
          }}
        >
          Full posts coming soon
        </motion.p>
      </div>
    </section>
  )
}