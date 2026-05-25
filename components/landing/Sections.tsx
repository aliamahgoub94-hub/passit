// ─── Proof Strip ──────────────────────────────────────────────
export function ProofStrip() {
  const stats = [
    { num: '2,400+', label: 'NZ students\nactively using Passit' },
    { num: '38', label: 'schools using\nclass licenses' },
    { num: '4.8★', label: 'average rating\nfrom student reviews' },
    { num: '91%', label: 'of Pro users improved\ntheir grade, or passed' },
  ]
  return (
    <div className="bg-[#091530] px-[6vw] py-3.5 flex items-center justify-center gap-8 md:gap-10 flex-wrap">
      {stats.map((s, i) => (
        <div key={s.num} className="flex items-center gap-3">
          {i > 0 && <div className="hidden md:block w-px h-6 bg-white/10" />}
          <div className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--font-bricolage)' }}>{s.num}</div>
          <div className="text-[13px] text-white/50 leading-tight whitespace-pre-line">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Features Row ─────────────────────────────────────────────
export function FeaturesRow() {
  const features = [
    {
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bg: 'bg-blue-50',
      title: 'Credit Tracker',
      desc: 'Always know exactly where you stand across all three NCEA levels — updated as results come in.',
    },
    {
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      bg: 'bg-green-50',
      title: 'AI Study Coach',
      desc: 'Knows every Achievement Standard. Builds your daily plan. Explains exactly what the marker wants.',
    },
    {
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-orange-50',
      title: 'Deadline Tracker',
      desc: 'Every internal, every external — ranked by urgency, with daily reminders. Never miss a due date again.',
    },
  ]
  return (
    <div id="features" className="grid grid-cols-1 md:grid-cols-3 border-b border-[#e1e8f5]">
      {features.map((f, i) => (
        <div
          key={f.title}
          className={`p-7 flex gap-4 items-start hover:bg-[#eef3ff] transition-colors cursor-default ${i < 2 ? 'md:border-r border-[#e1e8f5]' : ''} ${i < 2 ? 'border-b md:border-b-0 border-[#e1e8f5]' : ''}`}
        >
          <div className={`w-11 h-11 flex-shrink-0 ${f.bg} rounded-xl flex items-center justify-center`}>{f.icon}</div>
          <div>
            <div className="text-[14px] font-bold text-[#0f1f47] mb-1" style={{ fontFamily: 'var(--font-bricolage)' }}>{f.title}</div>
            <div className="text-[13px] text-[#64748b] leading-[1.55]">{f.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Compare Table ────────────────────────────────────────────
export function CompareSection() {
  const rows = [
    ['Credit tracking (all 3 levels)', '✅', '✗', '⚠️ Basic'],
    ['AI daily study plan', '✅', '✗', '✗'],
    ['Knows NCEA Achievement Standards', '✅', '✗', '✗'],
    ['Weak area detection', '✅', '✗', '✗'],
    ['Deadline reminders', '✅', '⚠️ Manual', '⚠️ Limited'],
    ['Merit / Excellence coaching', '✅', '✗', '✗'],
    ['Practice questions + feedback', '✅', '✗', '✗'],
    ['Mobile friendly', '✅', '⚠️ Varies', '⚠️ Limited'],
  ]
  return (
    <section id="why" className="py-20 px-[6vw] bg-white">
      <div className="max-w-[1100px] mx-auto text-center">
        <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#f97316] mb-2.5">Why Passit?</div>
        <h2 className="text-[clamp(26px,3.2vw,42px)] font-extrabold text-[#0f1f47] tracking-[-0.03em] mb-3"
            style={{ fontFamily: 'var(--font-bricolage)' }}>
          Other tools show you information.<br />Passit tells you what to do.
        </h2>
        <p className="text-[15px] text-[#64748b] max-w-[500px] mx-auto mb-12">Generic study apps don't know NCEA. Passit does.</p>
        <div className="max-w-[800px] mx-auto rounded-2xl overflow-hidden border border-[#e1e8f5] shadow-card reveal">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3.5 text-left text-xs font-bold bg-[#f7f9fe] border-b-2 border-[#e1e8f5] w-[38%]">Feature</th>
                <th className="p-3.5 text-center text-xs font-bold bg-[#0f1f47] text-white border-b-2 border-[#0f1f47]" style={{ fontFamily: 'var(--font-bricolage)' }}>Passit ✦</th>
                <th className="p-3.5 text-center text-[11px] text-[#64748b] font-semibold bg-[#f7f9fe] border-b-2 border-[#e1e8f5]">Generic<br />study apps</th>
                <th className="p-3.5 text-center text-[11px] text-[#64748b] font-semibold bg-[#f7f9fe] border-b-2 border-[#e1e8f5]">School<br />portals</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([feature, passit, generic, school], i) => (
                <tr key={feature} className={`hover:bg-[#fafcff] ${i % 2 === 1 ? 'bg-[rgba(37,99,235,0.02)]' : ''}`}>
                  <td className="p-3.5 text-[13px] font-semibold text-[#0f172a] border-b border-[#e1e8f5] text-left">{feature}</td>
                  <td className="p-3.5 text-center text-[13px] font-bold text-[#2563eb] bg-[rgba(37,99,235,0.04)] border-b border-[#e1e8f5]">{passit}</td>
                  <td className="p-3.5 text-center text-[13px] text-[#94a3b8] border-b border-[#e1e8f5]">{generic}</td>
                  <td className="p-3.5 text-center text-[13px] text-[#94a3b8] border-b border-[#e1e8f5]">{school}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────
export function TestimonialsSection() {
  const testimonials = [
    { stars: 5, text: 'I went from failing Level 2 to passing with Merit. I finally knew exactly which standards to focus on and what was due when. Game changer.', name: 'Amelia W.', school: 'Year 12 · Wellington', initials: 'AW', color: 'bg-blue-100 text-blue-700' },
    { stars: 5, text: 'The AI coach actually explained quadratic factorisation in a way that clicked for me. The practice questions matched exactly what came up in my internal.', name: 'James T.', school: 'Year 11 · Auckland', initials: 'JT', color: 'bg-green-100 text-green-700' },
    { stars: 5, text: 'As a teacher, I use the class license to see which students are at risk. It shows me credit gaps before results day — and parents love the transparency.', name: 'Ms. Hemi', school: 'HOD Maths · Christchurch', initials: 'MH', color: 'bg-amber-100 text-amber-700' },
  ]
  return (
    <section className="py-[72px] px-[6vw] bg-[#f7f9fe]">
      <div className="max-w-[1100px] mx-auto text-center">
        <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#f97316] mb-2.5">Student Reviews</div>
        <h2 className="text-[clamp(26px,3.2vw,42px)] font-extrabold text-[#0f1f47] tracking-[-0.03em] mb-10"
            style={{ fontFamily: 'var(--font-bricolage)' }}>
          What students are saying
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map(t => (
            <div key={t.name} className="bg-white rounded-2xl p-5.5 border border-[#e1e8f5] shadow-card hover:-translate-y-0.5 hover:shadow-card-lg transition-all reveal text-left" style={{ padding: '22px' }}>
              <div className="text-sm tracking-wider mb-2.5">{'⭐'.repeat(t.stars)}</div>
              <p className="text-[14px] text-[#0f172a] leading-[1.65] mb-4 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-[13px] font-bold flex-shrink-0`}>{t.initials}</div>
                <div>
                  <div className="text-[13px] font-bold text-[#0f1f47]">{t.name}</div>
                  <div className="text-[11px] text-[#64748b]">{t.school}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 

export function Sections() {
  return (
    <>
      <ProofStrip />
      <FeaturesRow />
      <CompareSection />
      <TestimonialsSection />
    </>
  )
}
