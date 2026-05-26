'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Terminal, X } from 'lucide-react'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveSection(e.target.id)),
      { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' }
    )
    document.querySelectorAll('section[id]').forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const handleClick = (href: string) => {
    setMobileOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 2.2 }}
        className={`navbar${scrolled ? ' scrolled' : ''}`}
      >
        <div className="navbar-inner">
          <button className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Terminal size={20} />
            <span>AN</span>
          </button>

          <div className="navbar-links">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleClick(link.href)}
                className={`nav-link${activeSection === link.href.slice(1) ? ' active' : ''}`}
              >
                <span style={{ color: 'rgba(0,255,136,0.6)', marginRight: 4 }}>{'>'}</span>
                {link.label}
                {activeSection === link.href.slice(1) && (
                  <motion.div layoutId="nav-indicator" className="nav-link-indicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
              </button>
            ))}
            <a href="/Abhinav_Nair_Resume.pdf" download className="navbar-resume">Resume</a>
          </div>

          <button className="navbar-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mobile-menu">
            {navLinks.map((link, i) => (
              <motion.button key={link.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} onClick={() => handleClick(link.href)} className="mobile-nav-link">
                <span style={{ color: 'var(--color-green)', marginRight: 8 }}>{'>'}</span>
                {link.label}
              </motion.button>
            ))}
            <motion.a initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }} href="/Abhinav_Nair_Resume.pdf" download className="btn-primary" style={{ marginTop: 16 }}>
              Download Resume
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}