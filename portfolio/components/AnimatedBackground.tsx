// components/AnimatedBackground.tsx
'use client'

import { useEffect, useRef } from 'react'

interface Dot {
  x: number
  y: number
  baseOpacity: number
  phase: number
  speed: number
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let dots: Dot[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initDots()
    }
    const initDots = () => {
      dots = []
      const spacing = 60
      const cols = Math.ceil(canvas.width / spacing)
      const rows = Math.ceil(canvas.height / spacing)

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dots.push({
            x: i * spacing + spacing / 2,
            y: j * spacing + spacing / 2,
            baseOpacity: Math.random() * 0.04 + 0.01,  // was 0.15 + 0.03 — way too bright
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.005 + 0.002,
          })
        }
      }
    }
    let time = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 1

      dots.forEach((dot) => {
        const opacity = dot.baseOpacity + Math.sin(time * dot.speed + dot.phase) * 0.06
        ctx.fillStyle = `rgba(0, 255, 136, ${Math.max(0, opacity)})`
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 1.2, 0, Math.PI * 2)
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    resize()
    animate()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
