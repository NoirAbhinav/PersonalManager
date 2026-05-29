import type { Metadata } from 'next'
import { JetBrains_Mono, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '700'],
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Abhinav Nair — Senior Backend Engineer',
  description:
    'Senior Backend Engineer with 3 years of experience building high-throughput distributed systems in Python and Rust, serving 500k+ users on AWS. Specialized in event-driven architecture and Generative AI.',
  keywords: [
    'Backend Engineer', 'Rust', 'Python', 'Distributed Systems',
    'AWS', 'FastAPI', 'Django', 'Microservices', 'OpenAI', 'Generative AI',
  ],
  authors: [{ name: 'Abhinav Nair', url: 'https://github.com/NoirAbhinav' }],
  creator: 'Abhinav Nair',
  metadataBase: new URL('https://abhinavnair.dev'), // update with your actual domain
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://abhinavnair.dev',
    title: 'Abhinav Nair — Senior Backend Engineer',
    description: 'Building systems that handle 20k+ events/sec, serving 500k+ users. Python · Rust · AWS · GenAI.',
    siteName: 'Abhinav Nair',
    images: [
      {
        url: '/og-image.png',   // create this — instructions below
        width: 1200,
        height: 630,
        alt: 'Abhinav Nair — Senior Backend Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abhinav Nair — Senior Backend Engineer',
    description: 'Building systems that handle 20k+ events/sec, serving 500k+ users.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${syne.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}