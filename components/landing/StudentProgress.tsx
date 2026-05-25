'use client'

import { useState } from 'react'

interface Criterion {
  name: string
  verdict: 'met' | 'partial' | 'missing'
  note: string
}

interface FeedbackJson {
  criteria: Criterion[]
  overall: string
}

interface Session {
  id: string
  student_email: string
  standard: string
  score_pct: number | null
  feedback_json: FeedbackJson | null
  created_at: string
}

const STANDARD_LABELS: Record<string, string> = {
  US32403: 'Reading',
  US32405: 'Writing',
  US32406: 'Numeracy',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getWeakSkills(feedback: FeedbackJson | null): string[] {
  if (!feedback?.criteria) return []
  return feedback.criteria
    .filter(c => c.verdict === 'partial' || c.verdict === 'missing')
    .map(c => c.name)
}

function verdictColor(verdict: string) {
  if (verdict === 'met') return 'text-green-600 bg-green-50'
  if (verdict === 'partial') return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

function scoreColor(score: number | null) {
  if (score == null) return 'text-[#64748b]'
  if (score >= 80) return 'text-green-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

export function StudentProgress() {
  const [email, setEmail] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    setSessions([])

    try {
      const res = await fetch(`/api/progress?email=${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      setSessions(data.sessions)
      setSearched(true)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  function handleStartPractice() {
    localStorage.setItem('passit_student_email', email.trim().toLowerCase())
    window.location.href = '/caa/'
  }

  return (
    <section className="py-16 px-[6vw] bg-[#f7f9fe] border-t border-[#e1e8f5]">
      <div className="max-w-[720px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#2563eb] mb-2.5">
            Your Progress
          </div>
          <h2
            className="text-[clamp(24px,3vw,36px)] font-extrabold text-[#0f1f47] tracking-[-0.03em] mb-3"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            Check your practice sessions
          </h2>
          <p className="text-[15px] text-[#64748b] max-w-[460px] mx-auto">
            Enter the email you used to practise and see your scores, feedback, and areas to work on.
          </p>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="flex gap-3 mb-2">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="Enter your email to see your progress"
            className="flex-1 px-4 py-3.5 rounded-xl border-2 border-[#e1e8f5] bg-white text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#2563eb] transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-[#2563eb] text-white rounded-xl text-[15px] font-bold hover:bg-[#1d4ed8] hover:-translate-y-px transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Loading...' : 'Look up'}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 mb-4 pl-1">{error}</p>
        )}

        {/* Results */}
        {searched && !loading && (
          <div className="mt-8">
            {sessions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-[#e1e8f5]">
                <div className="text-3xl mb-3">📭</div>
                <p className="text-[15px] font-semibold text-[#0f1f47] mb-1">No sessions found</p>
                <p className="text-sm text-[#64748b] mb-6">
                  We couldn&apos;t find any practice sessions for this email.
                </p>
                <button
                  onClick={handleStartPractice}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#f97316] text-white rounded-xl text-[15px] font-bold hover:bg-[#ea6b0f] hover:-translate-y-px transition-all shadow-[0_4px_14px_rgba(249,115,22,0.35)]"
                >
                  Start Practice
                  <span className="text-lg">→</span>
                </button>
              </div>
            ) : (
              <>
                {/* Start Practice CTA */}
                <div className="flex items-center justify-between bg-white rounded-2xl border border-[#e1e8f5] p-5 mb-5 shadow-sm">
                  <div>
                    <p className="text-[15px] font-bold text-[#0f1f47]">
                      {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
                    </p>
                    <p className="text-sm text-[#64748b]">
                      Keep practising to improve your scores
                    </p>
                  </div>
                  <button
                    onClick={handleStartPractice}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#f97316] text-white rounded-xl text-[14px] font-bold hover:bg-[#ea6b0f] hover:-translate-y-px transition-all shadow-[0_4px_14px_rgba(249,115,22,0.35)] whitespace-nowrap"
                  >
                    Start Practice →
                  </button>
                </div>

                {/* Session cards */}
                <div className="flex flex-col gap-4">
                  {sessions.map(s => {
                    const weakSkills = getWeakSkills(s.feedback_json)
                    const label = STANDARD_LABELS[s.standard] || s.standard

                    return (
                      <div
                        key={s.id}
                        className="bg-white rounded-2xl border border-[#e1e8f5] p-5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Top row: date + standard + score */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                                {formatDate(s.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-bold text-[#0f1f47]">{label}</span>
                              <span className="text-xs font-mono text-[#94a3b8]">{s.standard}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-extrabold ${scoreColor(s.score_pct)}`}
                                 style={{ fontFamily: 'var(--font-bricolage)' }}>
                              {s.score_pct != null ? `${s.score_pct}%` : '—'}
                            </div>
                            <div className="text-[11px] text-[#94a3b8] font-medium">Score</div>
                          </div>
                        </div>

                        {/* Criteria breakdown */}
                        {s.feedback_json?.criteria && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {s.feedback_json.criteria.map((c, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${verdictColor(c.verdict)}`}
                              >
                                {c.verdict === 'met' ? '✓' : c.verdict === 'partial' ? '⚠' : '✗'}
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Weak skills */}
                        {weakSkills.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                              Areas to improve:{' '}
                            </span>
                            <span className="text-sm text-[#0f172a]">
                              {weakSkills.join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Overall feedback */}
                        {s.feedback_json?.overall && (
                          <div className="bg-[#f7f9fe] rounded-xl p-3.5 border border-[#e1e8f5]">
                            <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                              Feedback
                            </span>
                            <p className="text-sm text-[#334155] leading-relaxed">
                              {s.feedback_json.overall}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
