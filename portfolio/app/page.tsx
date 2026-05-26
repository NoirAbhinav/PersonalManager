import AnimatedBackground from '@/components/AnimatedBackground'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Experience from '@/components/Experience'
import Skills from '@/components/Skills'
import Contact from '@/components/Contact'

export default function Home() {
  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Hero />
        <About />
        <Experience />
        <Skills />
        <Contact />
      </main>
    </>
  )
}