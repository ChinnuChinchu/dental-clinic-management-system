import BeforeAfter from '../components/home/BeforeAfter'
import CtaBanner from '../components/home/CtaBanner'
import Faq from '../components/home/Faq'
import Hero from '../components/home/Hero'
import Services from '../components/home/Services'
import Team from '../components/home/Team'
import Testimonials from '../components/home/Testimonials'
import WhyUs from '../components/home/WhyUs'

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <WhyUs />
      <BeforeAfter />
      <Team />
      <Testimonials />
      <Faq />
      <CtaBanner />
    </>
  )
}