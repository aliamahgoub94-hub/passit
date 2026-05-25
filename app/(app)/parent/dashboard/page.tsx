import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  WRITING_CRITERION_LABELS,
  WRITING_VERDICT_LABELS,
  READING_OUTCOME_LABELS,
  NUMERACY_OUTCOME_LABELS,
  getParentSummaryLabel,
} from '@/lib/caa-feedback'
import type {
  CaaSession,
  WritingCriterion,
  WritingVerdict,
  ReadingOutcome,
  NumeracyOutcome,
} from '@/types'

function VerdictBadge({ verdict }: { verdict: WritingVerdict | null }) {
  if (!verdict) {
    return (
      <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-passit-muted bg-passit-off border border-passit-border px-2.5 py-1 rounded-full">
        Not yet assessed
      </span>
    )
  }

  const styles = {
    met: 'text-green-700 bg-green-50 border-green-200',
    partial: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    missing: 'text-red-700 bg-red-50 border-red-200',
  }

  return (
    <span className={`text-[10px] font-extrabold uppercase tracking-[.12em] px-2.5 py-1 rounded-full border ${styles[verdict]}`}>
      {WRITING_VERDICT_LABELS[verdict]}
    </span>
  )
}

function VerdictBar({ verdict }: { verdict: WritingVerdict | null }) {
  const colors = {
    met: 'bg-green-500',
    partial: 'bg-yellow-500',
    missing: 'bg-red-500',
  }

  const widths = {
    met: '100%',
    partial: '60%',
    missing: '20%',
  }

  return (
    <div className="h-3 rounded-full bg-passit-off border border-passit-border overflow-hidden">
      {verdict && (
        <div
          className={`h-full rounded-full ${colors[verdict]}`}
          style={{ width: widths[verdict] }}
        />
      )}
    </div>
  )
}

function OutcomeBar({ score, total }: { score: number; total: number }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="h-3 rounded-full bg-passit-off border border-passit-border overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default async function ParentDashboardPage() {
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) redirect('/auth/login')

  const { data: parentLinks } = await supabase
    .from('parent_links')
    .select('student_id')
    .eq('parent_id', user.id)

  const studentIds = parentLinks?.map(l => l.student_id) ?? []

  if (studentIds.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <div className="text-[11px] font-bold uppercase tracking-[.14em] text-brand-blue mb-2">
            Parent Dashboard
          </div>
          <h1 className="font-display text-3xl font-extrabold text-navy tracking-tight">
            Your child&apos;s progress
          </h1>
        </header>
        <div className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-6">
          <p className="text-sm text-passit-muted">
            No linked students yet. Ask your child to connect your account from their settings.
          </p>
        </div>
      </div>
    )
  }

  const studentId = studentIds[0]

  const { data: sessions = [] } = await supabase
    .from('caa_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  const writingSessions = (sessions as CaaSession[]).filter(s => s.standard === 'US32405')
  const readingSessions = (sessions as CaaSession[]).filter(s => s.standard === 'US32403')
  const numeracySessions = (sessions as CaaSession[]).filter(s => s.standard === 'US32406')

  const latestWritingSession = writingSessions[0]
  const latestReadingSession = readingSessions[0]
  const latestNumeracySession = numeracySessions[0]

  let writingResults: { criterion: WritingCriterion; verdict: WritingVerdict; feedback: string }[] = []
  if (latestWritingSession) {
    const { data } = await supabase
      .from('writing_results')
      .select('criterion, verdict, feedback')
      .eq('session_id', latestWritingSession.id)
    writingResults = (data ?? []) as typeof writingResults
  }

  let readingResults: { question_number: number; outcome: ReadingOutcome; correct: boolean; feedback: string }[] = []
  if (latestReadingSession) {
    const { data } = await supabase
      .from('reading_results')
      .select('question_number, outcome, correct, feedback')
      .eq('session_id', latestReadingSession.id)
      .order('question_number', { ascending: true })
    readingResults = (data ?? []) as typeof readingResults
  }

  let numeracyResults: { question_number: number; outcome: NumeracyOutcome; correct: boolean; feedback: string }[] = []
  if (latestNumeracySession) {
    const { data } = await supabase
      .from('numeracy_results')
      .select('question_number, outcome, correct, feedback')
      .eq('session_id', latestNumeracySession.id)
      .order('question_number', { ascending: true })
    numeracyResults = (data ?? []) as typeof numeracyResults
  }

  const readingByOutcome = (['outcome_1', 'outcome_2', 'outcome_3'] as ReadingOutcome[]).map(outcome => {
    const qs = readingResults.filter(r => r.outcome === outcome)
    return {
      outcome,
      label: READING_OUTCOME_LABELS[outcome],
      correct: qs.filter(q => q.correct).length,
      total: qs.length,
    }
  })

  const numeracyByOutcome = (['outcome_1', 'outcome_2', 'outcome_3'] as NumeracyOutcome[]).map(outcome => {
    const qs = numeracyResults.filter(r => r.outcome === outcome)
    return {
      outcome,
      label: NUMERACY_OUTCOME_LABELS[outcome],
      correct: qs.filter(q => q.correct).length,
      total: qs.length,
    }
  })

  const readingWeakest = readingByOutcome.length > 0
    ? readingByOutcome.reduce((w, c) => (c.total > 0 && c.correct / c.total < (w.total > 0 ? w.correct / w.total : 1)) ? c : w, readingByOutcome[0])
    : null

  const numeracyWeakest = numeracyByOutcome.length > 0
    ? numeracyByOutcome.reduce((w, c) => (c.total > 0 && c.correct / c.total < (w.total > 0 ? w.correct / w.total : 1)) ? c : w, numeracyByOutcome[0])
    : null

  const writingWeakest = writingResults.length > 0
    ? writingResults.find(r => r.verdict === 'missing') ?? writingResults.find(r => r.verdict === 'partial')
    : null

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.14em] text-brand-blue mb-2">
            Parent Dashboard
          </div>
          <h1 className="font-display text-3xl font-extrabold text-navy tracking-tight">
            Your child&apos;s CAA progress
          </h1>
          <p className="text-passit-muted text-sm mt-1">
            See how they&apos;re tracking across Writing, Reading, and Numeracy.
          </p>
        </div>
      </header>

      {/* Writing (US32405) */}
      <section className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
              Writing — US32405
            </div>
            <h2 className="font-display text-xl font-extrabold text-navy">
              Writing Assessment
            </h2>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
            latestWritingSession
              ? latestWritingSession.score !== null && latestWritingSession.score >= 80
                ? 'text-green-700 bg-green-50 border-green-200'
                : latestWritingSession.score !== null && latestWritingSession.score >= 50
                  ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                  : 'text-red-700 bg-red-50 border-red-200'
              : 'text-passit-muted bg-passit-off border-passit-border'
          }`}>
            {getParentSummaryLabel(latestWritingSession?.score ?? null)}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {(['ideas_content', 'structure_flow', 'tone_language', 'accuracy'] as WritingCriterion[]).map(criterion => {
            const result = writingResults.find(r => r.criterion === criterion)
            return (
              <div key={criterion}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-navy">
                    {WRITING_CRITERION_LABELS[criterion]}
                  </span>
                  <VerdictBadge verdict={result?.verdict ?? null} />
                </div>
                <VerdictBar verdict={result?.verdict ?? null} />
                {result?.feedback && (
                  <p className="text-xs text-passit-muted mt-1.5 leading-relaxed">
                    {result.feedback}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {writingWeakest && (
          <div className="mt-4 rounded-2xl bg-passit-off border border-passit-border p-4">
            <div className="text-xs font-bold text-navy mb-1">What to practise next:</div>
            <p className="text-xs text-passit-muted leading-relaxed">
              Focus on &quot;{WRITING_CRITERION_LABELS[writingWeakest.criterion]}&quot; — {writingWeakest.feedback}
            </p>
          </div>
        )}
      </section>

      {/* Reading (US32403) */}
      <section className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
              Reading — US32403
            </div>
            <h2 className="font-display text-xl font-extrabold text-navy">
              Reading Assessment
            </h2>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
            latestReadingSession
              ? latestReadingSession.score !== null && latestReadingSession.total
                ? ((latestReadingSession.score / latestReadingSession.total) * 100) >= 80
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : ((latestReadingSession.score / latestReadingSession.total) * 100) >= 50
                    ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                : 'text-passit-muted bg-passit-off border-passit-border'
              : 'text-passit-muted bg-passit-off border-passit-border'
          }`}>
            {latestReadingSession && latestReadingSession.score !== null && latestReadingSession.total
              ? getParentSummaryLabel(Math.round((latestReadingSession.score / latestReadingSession.total) * 100))
              : getParentSummaryLabel(null)}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {readingByOutcome.map(({ outcome, label, correct, total }) => (
            <div key={outcome}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-navy">{label}</span>
                <span className="text-xs font-bold text-passit-muted">
                  {total > 0 ? `${correct}/${total}` : 'No data yet'}
                </span>
              </div>
              <OutcomeBar score={correct} total={total || 1} />
            </div>
          ))}
        </div>

        {latestReadingSession && latestReadingSession.score !== null && (
          <div className="mt-3 text-sm text-passit-muted">
            Score: {latestReadingSession.score} out of {latestReadingSession.total ?? 6} per session (6 questions per passage)
          </div>
        )}

        {readingWeakest && readingWeakest.total > 0 && (
          <div className="mt-4 rounded-2xl bg-passit-off border border-passit-border p-4">
            <div className="text-xs font-bold text-navy mb-1">What to practise next:</div>
            <p className="text-xs text-passit-muted leading-relaxed">
              Focus on &quot;{readingWeakest.label}&quot; — this was the weakest area in the latest session.
            </p>
          </div>
        )}
      </section>

      {/* Numeracy (US32406) */}
      <section className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
              Numeracy — US32406
            </div>
            <h2 className="font-display text-xl font-extrabold text-navy">
              Numeracy Assessment
            </h2>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
            latestNumeracySession
              ? latestNumeracySession.score !== null && latestNumeracySession.total
                ? ((latestNumeracySession.score / latestNumeracySession.total) * 100) >= 80
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : ((latestNumeracySession.score / latestNumeracySession.total) * 100) >= 50
                    ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                : 'text-passit-muted bg-passit-off border-passit-border'
              : 'text-passit-muted bg-passit-off border-passit-border'
          }`}>
            {latestNumeracySession && latestNumeracySession.score !== null && latestNumeracySession.total
              ? getParentSummaryLabel(Math.round((latestNumeracySession.score / latestNumeracySession.total) * 100))
              : getParentSummaryLabel(null)}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {numeracyByOutcome.map(({ outcome, label, correct, total }) => (
            <div key={outcome}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-navy">{label}</span>
                <span className="text-xs font-bold text-passit-muted">
                  {total > 0 ? `${correct}/${total} correct` : 'No data yet'}
                </span>
              </div>
              <OutcomeBar score={correct} total={total || 1} />
            </div>
          ))}
        </div>

        {latestNumeracySession && latestNumeracySession.score !== null && (
          <div className="mt-3 text-sm text-passit-muted">
            Score: {latestNumeracySession.score} out of {latestNumeracySession.total} correct
          </div>
        )}

        {numeracyWeakest && numeracyWeakest.total > 0 && (
          <div className="mt-4 rounded-2xl bg-passit-off border border-passit-border p-4">
            <div className="text-xs font-bold text-navy mb-1">What to practise next:</div>
            <p className="text-xs text-passit-muted leading-relaxed">
              Focus on &quot;{numeracyWeakest.label}&quot; — this was the weakest area in the latest session.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
