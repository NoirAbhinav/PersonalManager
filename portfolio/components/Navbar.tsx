'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Terminal, X } from 'lucide-react'
import { track } from '@vercel/analytics'

const navLinks = [
  { label: 'About',      href: '#about'      },
  { label: 'Experience', href: '#experience' },
  { label: 'Skills',     href: '#skills'     },
  // { label: 'Projects',   href: '#projects'   },
  { label: 'Activity',   href: '#github'     },
  { label: 'Writing',    href: '#blog'       },
  { label: 'Contact',    href: '#contact'    },
]

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false)
  const [activeSection, setActive]    = useState('')
  const [mobileOpen, setMobileOpen]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setActive(e.target.id)),
      { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' }
    )
    document.querySelectorAll('section[id]').forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const go = (href: string) => {
    track('navbar_click', { destination: href })
    setMobileOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }} animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 2.2 }}
        className={`navbar${scrolled ? ' scrolled' : ''}`}
      >
        <div className="navbar-inner">
          <button className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Terminal size={20} />
            <span>AN</span>
          </button>

          <div className="navbar-links">
            {navLinks.map(link => (
              <button key={link.href} onClick={() => go(link.href)}
                className={`nav-link${activeSection === link.href.slice(1) ? ' active' : ''}`}>
                <span style={{ color: 'rgba(0,255,136,0.5)', marginRight: 3 }}>{'>'}</span>
                {link.label}
                {activeSection === link.href.slice(1) && (
                  <motion.div layoutId="nav-indicator" className="nav-link-indicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
              </button>
            ))}
            <a href="/Abhinav_Nair_Resume.pdf" download className="navbar-resume" onClick={() => track('resume_download', { location: 'navbar_desktop' })}>Resume</a>
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
              <motion.button key={link.href}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => go(link.href)} className="mobile-nav-link">
                <span style={{ color: 'var(--color-green)', marginRight: 8 }}>{'>'}</span>
                {link.label}
              </motion.button>
            ))}
            <motion.a initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }} href="/Abhinav_Nair_Resume.pdf" download
              className="btn-primary" style={{ marginTop: 16 }} onClick={() => track('resume_download', { location: 'navbar_mobile' })}>
              Download Resume
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}