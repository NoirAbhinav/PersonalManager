// components/Hero.tsx
'use client'
import { useEffect, useState } from 'react'

const lines = [
  '> Initializing portfolio...',
  '> Loading: Abhinav Nair',
  '> Role: Senior Backend Engineer',
  '> Stack: Python · Rust · AWS · AI',
  '> Systems serving 500k+ users',
  '> Status: Open to opportunities_',
]

export default function Hero() {
  const [visible, setVisible] = useState<string[]>([])

  useEffect(() => {
    lines.forEach((line, i) => {
      setTimeout(() => {
        setVisible(prev => [...prev, line])
      }, i * 400)
    })
  }, [])

  return (
    <section className="min-h-screen flex items-center px-8 py-24">
      <div className="max-w-3xl">
        {visible.map((line, i) => (
          <p key={i} className="text-green-400 font-mono text-lg mb-2
                                animate-fade-in">
            {line}
          </p>
        ))}
      </div>
    </section>
  )
}