import type { Metadata } from 'next'
import { JetBrains_Mono, Syne } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Abhinav Nair — Senior Backend Engineer',
  description: 'Backend engineer specializing in distributed systems, Rust, Python, and Generative AI. Building high-throughput infrastructure at scale.',
  keywords: ['Backend Engineer', 'Rust', 'Python', 'Distributed Systems', 'AWS'],
  authors: [{ name: 'Abhinav Nair' }],
  openGraph: {
    title: 'Abhinav Nair — Senior Backend Engineer',
    description: 'Building systems that handle 20k+ events/sec serving 500k+ users.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${syne.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}