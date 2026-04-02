'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollToCta = () => {
    document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <nav className="flex items-center justify-between px-[6vw] h-[66px] bg-white/92 backdrop-blur-md border-b border-[#e1e8f5] sticky top-0 z-50 shadow-[0_1px_16px_rgba(15,31,71,0.07)]">
      <Logo />

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-0.5">
        {['Features', 'Pricing', 'FAQs'].map(link => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748b] hover:text-[#2563eb] hover:bg-[#eef3ff] transition-all duration-150 cursor-pointer no-underline"
          >
            {link}
          </a>
        ))}
        <Link
          href="/auth/login"
          className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748b] hover:text-[#2563eb] hover:bg-[#eef3ff] transition-all duration-150 no-underline"
        >
          Login
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={scrollToCta}
          className="hidden md:block bg-[#f97316] text-white px-5 py-2.5 rounded-[9px] text-sm font-bold hover:bg-[#ea6b0f] hover:-translate-y-px transition-all shadow-[0_2px_10px_rgba(249,115,22,0.32)] cursor-pointer"
        >
          Get Started Free →
        </button>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`block w-5 h-0.5 bg-[#0f1f47] transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#0f1f47] transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#0f1f47] transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-[66px] left-0 right-0 bg-white border-b border-[#e1e8f5] shadow-lg z-50 px-6 py-4 flex flex-col gap-2">
          {['Features', 'Pricing', 'FAQs'].map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="py-2 text-sm font-medium text-[#64748b] hover:text-[#2563eb] no-underline"
            >
              {link}
            </a>
          ))}
          <Link href="/auth/login" className="py-2 text-sm font-medium text-[#64748b] no-underline" onClick={() => setMenuOpen(false)}>
            Login
          </Link>
          <button
            onClick={scrollToCta}
            className="mt-2 bg-[#f97316] text-white py-3 rounded-[9px] text-sm font-bold cursor-pointer"
          >
            Get Started Free →
          </button>
        </div>
      )}
    </nav>
  )
}
