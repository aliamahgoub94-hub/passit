import { Nav } from '@/components/landing/Nav'
import { Hero } from '@/components/landing/Hero'
import { Sections } from '@/components/landing/Sections'
import { Pricing } from '@/components/landing/Pricing'

export default function HomePage() {
  return (
    <main>
      <Nav />
      <Hero />
      <Sections />
      <Pricing />
    </main>
  )
}
