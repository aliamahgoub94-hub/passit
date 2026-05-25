'use client'

export function Hero() {
  const scrollToCta = () => document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section
      className="relative overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-10 items-end px-[6vw] pt-[68px] min-h-[530px]"
      style={{ background: 'linear-gradient(160deg, #091530 0%, #0f1f47 55%, #1a3580 100%)' }}
    >
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 85% 15%, rgba(59,130,246,0.22) 0%, transparent 50%), radial-gradient(ellipse at 15% 85%, rgba(249,115,22,0.13) 0%, transparent 50%)'
      }} />
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px'
      }} />

      {/* Left */}
      <div className="pb-[60px] relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-[#93c5fd] px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 animate-fade-up">
          🇳🇿 Built for NZ Students · NCEA Levels 1–3
        </div>

        <h1
          className="text-[clamp(36px,4.5vw,58px)] font-extrabold leading-[1.06] text-white tracking-[-0.03em] mb-4 animate-fade-up-1"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          Stop guessing.<br />
          Start{' '}
          <span className="relative inline-block text-[#f97316]">
            passing
            <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#f97316] rounded-sm" />
          </span>{' '}
          NCEA.
        </h1>

        <p className="text-[17px] text-white/80 leading-[1.7] mb-8 font-normal max-w-[450px] animate-fade-up-2">
          Passit is your AI study coach that knows every NCEA standard. It tracks your credits, flags your deadlines, and tells you{' '}
          <strong className="text-white font-semibold">exactly what to study — every single day.</strong>
        </p>

        <div className="flex gap-3 items-center mb-8 animate-fade-up-3">
          <button
            onClick={scrollToCta}
            className="bg-[#f97316] text-white px-7 py-3.5 rounded-xl text-[15px] font-bold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(249,115,22,0.52)] transition-all shadow-[0_4px_18px_rgba(249,115,22,0.4)] cursor-pointer border-none"
          >
            Get Started Free 🚀
          </button>
          <button className="bg-white/10 border border-white/25 text-white px-6 py-3.5 rounded-xl text-[15px] font-semibold flex items-center gap-2 hover:bg-white/15 transition-all cursor-pointer">
            ▶ Watch 90-sec Demo
          </button>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          {['Credit tracking across all 3 levels', 'AI-powered daily plans', 'NZQA-aligned content'].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-xs text-white/50 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right — dashboard preview */}
      <div className="relative z-10 hidden md:block self-end">
        <div className="relative max-w-[390px] mx-auto">
          {/* Float cards */}
          <div className="absolute -top-9 -right-3 bg-white rounded-xl px-3.5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.18)] animate-float z-10">
            <div className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider mb-1">English due in</div>
            <div className="text-sm font-black text-red-600">⚠️ 6 days!</div>
          </div>
          <div className="absolute -top-2 -left-4 bg-white rounded-xl px-3.5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.18)] animate-float-delay z-10">
            <div className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider mb-1">Today's plan ready</div>
            <div className="text-sm font-black text-green-600">✅ 3 tasks</div>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-t-2xl p-5 shadow-[0_-10px_48px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e1e8f5]">
              <div className="text-[13px] font-bold text-[#0f1f47]">📊 Passit Dashboard</div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#16a34a] bg-green-50 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-dot-pulse" />
                Synced
              </div>
            </div>
            <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1">Credits Earned</div>
            <div className="text-[44px] font-extrabold text-[#2563eb] leading-none tracking-[-2px] mb-1"
                 style={{ fontFamily: 'var(--font-bricolage)' }}>
              52
            </div>
            <div className="text-[11px] text-[#64748b] mb-3.5">of 80 needed — Level 2 certificate</div>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Level 1', value: '80/80 ✓ Done', width: '100%', color: 'linear-gradient(90deg,#16a34a,#4ade80)' },
                { label: 'Level 2', value: '52/80', width: '65%', color: 'linear-gradient(90deg,#2563eb,#60a5fa)' },
                { label: 'Level 3', value: 'Not started', width: '0%', color: 'linear-gradient(90deg,#9b8cff,#c4b5fd)' },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-[10px] font-semibold text-[#0f172a] mb-1">
                    {bar.label} <span className="text-[#64748b]">{bar.value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bar-animated" style={{ width: bar.width, background: bar.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
