import Link from 'next/link'

export function PricingSection() {
  const freeFeats = [
    { on: true,  text: 'Credit tracker (all 3 levels)' },
    { on: true,  text: 'Deadline tracker' },
    { on: true,  text: 'Basic daily study plan' },
    { on: true,  text: '5 AI coach questions per day' },
    { on: false, text: 'Unlimited AI coaching' },
    { on: false, text: 'Practice questions + feedback' },
    { on: false, text: 'Weak area detection' },
  ]
  const proFeats = [
    'Everything in Free',
    'Unlimited AI study coach',
    'Personalised daily plans',
    'Practice questions + instant feedback',
    'Weak area detection & coaching',
    'Merit / Excellence pathway coaching',
    'UE requirements tracker',
  ]

  return (
    <section id="pricing" className="py-20 px-[6vw] bg-[#f7f9fe]">
      <div className="max-w-[1100px] mx-auto text-center">
        <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#f97316] mb-2.5">Pricing</div>
        <h2 className="text-[clamp(26px,3.2vw,42px)] font-extrabold text-[#0f1f47] tracking-[-0.03em] mb-2"
            style={{ fontFamily: 'var(--font-bricolage)' }}>
          Simple. Fair. Student-priced.
        </h2>
        <p className="text-[15px] text-[#64748b] mb-12">Start free today. Upgrade when you're ready.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[720px] mx-auto" style={{ gridTemplateColumns: '1fr 1.15fr' }}>
          {/* Free */}
          <div className="bg-white rounded-2xl p-8 border-2 border-[#e1e8f5] hover:-translate-y-1 transition-all reveal">
            <div className="text-[11px] font-bold uppercase tracking-[.13em] text-[#64748b] mb-2.5">Free</div>
            <div className="text-[50px] font-extrabold text-[#0f1f47] tracking-[-0.04em] leading-none mb-1"
                 style={{ fontFamily: 'var(--font-bricolage)' }}>
              <sup className="text-xl align-super">$</sup>0
            </div>
            <div className="text-[12px] text-[#64748b] mb-6">Free forever · no credit card needed</div>
            <div className="flex flex-col gap-2.5 mb-6 text-left">
              {freeFeats.map(f => (
                <div key={f.text} className={`flex gap-2 items-start text-[13px] ${f.on ? 'text-[#0f172a]' : 'text-[#94a3b8]'}`}>
                  <span className="text-sm flex-shrink-0 mt-0.5">{f.on ? '✅' : '○'}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth/login"
              className="block w-full py-3.5 rounded-xl text-[14px] font-bold text-center bg-white text-[#0f1f47] border-2 border-[#e1e8f5] hover:border-[#2563eb] hover:text-[#2563eb] transition-all no-underline"
            >
              Start for free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-br from-[#f0f5ff] to-white rounded-2xl p-8 border-2 border-[#2563eb] shadow-[0_12px_48px_rgba(37,99,235,0.18)] hover:-translate-y-1 transition-all relative reveal">
            <div className="absolute top-4 right-4 bg-[#f97316] text-white text-[9px] font-extrabold uppercase tracking-[.1em] px-3 py-1 rounded-full">
              Most Popular
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[.13em] text-[#2563eb] mb-2.5">Pro</div>
            <div className="text-[50px] font-extrabold text-[#2563eb] tracking-[-0.04em] leading-none mb-1"
                 style={{ fontFamily: 'var(--font-bricolage)' }}>
              <sup className="text-xl align-super">$</sup>12
            </div>
            <div className="text-[12px] text-[#64748b] mb-1">NZD per month · cancel anytime</div>
            <div className="text-[11px] font-bold text-[#16a34a] mb-6">Less than one tutoring session 👍</div>
            <div className="flex flex-col gap-2.5 mb-6 text-left">
              {proFeats.map(f => (
                <div key={f} className="flex gap-2 items-start text-[13px] text-[#0f172a]">
                  <span className="text-sm flex-shrink-0 mt-0.5">✅</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth/login?plan=pro"
              className="block w-full py-3.5 rounded-xl text-[14px] font-bold text-center bg-[#f97316] text-white hover:bg-[#ea6b0f] hover:-translate-y-px transition-all shadow-[0_2px_14px_rgba(249,115,22,0.35)] no-underline"
            >
              Start 7-day free trial →
            </Link>
          </div>
        </div>

        {/* B2B */}
        <div className="max-w-[720px] mx-auto mt-4 px-5 py-4 bg-gradient-to-r from-[rgba(37,99,235,0.06)] to-[rgba(37,99,235,0.02)] border border-[rgba(37,99,235,0.14)] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 reveal">
          <div className="text-left">
            <div className="text-[14px] font-semibold text-[#0f1f47]">🏫 Schools & Teachers</div>
            <div className="text-[13px] text-[#64748b] mt-0.5">Class-level credit tracking, at-risk alerts, and HOD dashboards. 38 NZ schools already on board.</div>
          </div>
          <button className="flex-shrink-0 bg-[#0f1f47] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold hover:bg-[#1e3a8a] transition-colors cursor-pointer border-none">
            See school pricing →
          </button>
        </div>
      </div>
    </section>
  )
}
