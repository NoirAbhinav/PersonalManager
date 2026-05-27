import AnimatedBackground from '@/components/AnimatedBackground'
import Navbar     from '@/components/Navbar'
import Hero       from '@/components/Hero'
import About      from '@/components/About'
import Experience from '@/components/Experience'
import Skills     from '@/components/Skills'
import Projects   from '@/components/Projects'
import Contact    from '@/components/Contact'
import Blog       from '@/components/Blog'

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
        {/* <Projects /> */}
        <Blog />
        <Contact />
      </main>
    </>
  )
}