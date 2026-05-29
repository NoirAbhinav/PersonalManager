'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowUpRight, FileDown, Mail, Phone } from 'lucide-react'
import { Github, Linkedin } from '@/components/Icons'
import { track } from '@vercel/analytics'

const links = [
  { icon: Mail, label: 'Email', value: 'abhinavbbps2000@gmail.com', href: 'mailto:abhinavbbps2000@gmail.com', color: 'green' },
  { icon: Github, label: 'GitHub', value: 'github.com/NoirAbhinav', href: 'https://github.com/NoirAbhinav', color: 'green' },
  { icon: Linkedin, label: 'LinkedIn', value: 'linkedin.com/in/abhinav-nair-n3747', href: 'https://linkedin.com/in/abhinav-nair-n3747', color: 'blue' },
  { icon: Phone, label: 'Phone', value: '+91 78275 98718', href: 'tel:+917827598718', color: 'amber' },
]

const iconClass = { green: 'contact-icon-green', amber: 'contact-icon-amber', blue: 'contact-icon-blue' }

export default function Contact() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="contact">
      <div className="gradient-line" />
      <div className="section-container" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }} className="contact-header">
          <p className="section-label">// contact</p>
          <h2 className="section-title" style={{ marginBottom: 12 }}>Get In Touch</h2>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.875rem', maxWidth: 480, margin: '0 auto' }}>
            Open to discussing backend engineering, distributed systems, and new opportunities.
          </p>
        </motion.div>

        <div className="contact-grid">
          {links.map((link, i) => (
            <motion.a key={link.label} href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              onClick={() => track('contact_link_click', { platform: link.label.toLowerCase() })}
              initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="glass-card contact-card">
              <div className={`contact-icon-wrap ${iconClass[link.color as keyof typeof iconClass]}`}>
                <link.icon size={20} />
              </div>
              <div className="contact-info">
                <div className="contact-label">{link.label}</div>
                <div className="contact-value">{link.value}</div>
              </div>
              <div className="contact-arrow"><ArrowUpRight size={15} /></div>
            </motion.a>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }} className="contact-cta">
          <a href="/Abhinav_Nair_Resume.pdf" download className="btn-primary" style={{ fontSize: '0.95rem', padding: '14px 32px' }} onClick={() => track('resume_download', { location: 'contact' })}>
            <FileDown size={18} />
            Download Full Resume
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }} className="footer-bar">
          <p className="footer-text">
            <span className="text-green">{'>'}</span> Designed &amp; built by Abhinav Nair · {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </section>
  )
}