import type { Metadata } from 'next'
import { JetBrains_Mono, Syne } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',  // ← matches var(--font-jetbrains) in @theme
  weight: ['400', '500', '700'],
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',       // ← matches var(--font-syne) in @theme
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Abhinav Nair — Senior Backend Engineer',
  description: 'Backend engineer specializing in distributed systems, Rust, Python, and Generative AI.',
  authors: [{ name: 'Abhinav Nair' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${syne.variable}`}>
      <body>{children}</body>
    </html>
  )
}