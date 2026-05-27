import AnimatedBackground   from '@/components/AnimatedBackground'
import StatusBanner         from '@/components/StatusBanner'

import Navbar               from '@/components/Navbar'
import Hero                 from '@/components/Hero'
import About                from '@/components/About'
import Experience           from '@/components/Experience'
import SkillsRadar          from '@/components/SkillsRadar'

// import Projects             from '@/components/Projects'
import GitHubActivity       from '@/components/GithubActivity'

import Blog                 from '@/components/Blog'
import Contact              from '@/components/Contact'
import Terminal             from '@/components/Terminal'

export default function Home() {
  return (
    <>
      <AnimatedBackground />
      <StatusBanner />
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Hero />
        <About />
        <Experience />
        <SkillsRadar />
        {/* <Projects /> */}
        <GitHubActivity />
        <Blog />
        <Contact />
      </main>
      <Terminal />
    </>
  )
}