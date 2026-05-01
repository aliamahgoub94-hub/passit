import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  calculateCreditSummary,
  formatDaysUntil,
  getDeadlines,
  gradeColor,
  urgencyColor,
} from '@/lib/ncea'
import type { Assessment, NceaLevel, Subject } from '@/types'

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value))
}

function levelLabel(level: NceaLevel) {
  return `Level ${level}`
}

function buildDailyPlan(args: {
  current: ReturnType<typeof calculateCreditSummary>
  deadlines: ReturnType<typeof getDeadlines>
}) {
  const { current, deadlines } = args
  const tasks: { title: string; hint: string; badge?: string }[] = []

  const topDeadline = deadlines[0]
  if (topDeadline) {
    tasks.push({
      title: `Make a 30-minute plan for "${topDeadline.assessment.title}"`,
      hint: `${topDeadline.subject.name} · due ${formatDaysUntil(topDeadline.daysUntil)}`,
      badge: topDeadline.urgency === 'critical' ? 'Urgent' : 'Next up',
    })
  }

  if (current.needed > 0) {
    tasks.push({
      title: `Close your credits gap: ${current.earned} / 80 earned`,
      hint: `You need ${current.needed} more credits to pass ${levelLabel(current.level)}.`,
      badge: 'Credits',
    })
  }

  if (current.endorsementGap.excellence > 0) {
    tasks.push({
      title: 'Push for Excellence credits',
      hint: `You’re ${current.endorsementGap.excellence} E credits away from an Excellence endorsement.`,
      badge: 'E',
    })
  } else if (current.endorsementGap.merit > 0) {
    tasks.push({
      title: 'Push for Merit+ credits',
      hint: `You’re ${current.endorsementGap.merit} M/E credits away from a Merit endorsement.`,
      badge: 'M/E',
    })
  }

  if (!tasks.length) {
    tasks.push(
      {
        title: 'Pick one standard and go one step deeper',
        hint: 'Aim for Merit/Excellence by learning the exact criteria and writing a model answer.',
      },
      {
        title: 'Do a quick self-check',
        hint: 'What’s your weakest topic this week? Write it down, then fix it.',
      },
      {
        title: 'Lock in tomorrow’s plan',
        hint: 'Choose your next assessment and set a tiny deadline (30 mins).',
      }
    )
  }

  return tasks.slice(0, 3)
}

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) redirect('/auth/login')

  const { data: profileRow, error: profileErr } = await supabase
    .from('profiles')
    .select('id,ncea_level,onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profileErr) {
    return (
      <div className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-6">
        <h1 className="font-display text-xl font-extrabold text-navy mb-1">Dashboard</h1>
        <p className="text-sm text-red-600">Couldn’t load your profile: {profileErr.message}</p>
      </div>
    )
  }

  const nceaLevel = (profileRow?.ncea_level ?? 1) as NceaLevel
  const onboardingComplete = Boolean(profileRow?.onboarding_complete)

  if (!onboardingComplete) redirect('/onboarding')

  const { data: subjects = [] } = await supabase
    .from('subjects')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: true })

  const { data: assessmentsRaw = [] } = await supabase
    .from('assessments')
    .select('*, subject:subjects(*)')
    .eq('student_id', user.id)
    .order('due_date', { ascending: true })

  const assessments = (assessmentsRaw as Assessment[]).map(a => ({
    ...a,
    subject: a.subject ?? (subjects as Subject[]).find(s => s.id === a.subject_id),
  }))

  const summaries = ([1, 2, 3] as NceaLevel[]).map(level => calculateCreditSummary(assessments, level))
  const current = summaries.find(s => s.level === nceaLevel) ?? summaries[0]
  const deadlines = getDeadlines(assessments).slice(0, 3)
  const dailyPlan = buildDailyPlan({ current, deadlines })

  const pct = clampPct((current.earned / 80) * 100)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.14em] text-brand-orange mb-2">
            Student Dashboard
          </div>
          <h1 className="font-display text-3xl font-extrabold text-navy tracking-tight">
            Check your readiness
          </h1>
          <p className="text-passit-muted text-sm mt-1">
            Level-by-level progress, deadlines, and a daily plan — in one clean view.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center bg-brand-orange text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-brand-orange-dark transition-colors no-underline"
        >
          Check your readiness →
        </Link>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credits */}
        <div className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
                Credits earned
              </div>
              <div className="flex items-baseline gap-3">
                <div className="font-display text-4xl font-extrabold text-navy tracking-tight">
                  {current.earned}
                </div>
                <div className="text-sm font-semibold text-passit-muted">
                  / 80 for {levelLabel(current.level)}
                </div>
              </div>
            </div>

            <span
              className={[
                'text-xs font-bold px-3 py-1.5 rounded-full border',
                current.passed
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : 'text-brand-blue bg-brand-sky border-[#dbe7ff]',
              ].join(' ')}
            >
              {current.passed ? 'Passed ✅' : `${current.needed} to go`}
            </span>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-[11px] font-bold text-passit-muted mb-2">
              <span>Progress</span>
              <span>{Math.round(pct)}%</span>
            </div>
            <div className="h-3 rounded-full bg-passit-off border border-passit-border overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-blue"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-passit-off border border-passit-border p-4">
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-passit-muted mb-1">
                Achieved+
              </div>
              <div className="text-lg font-extrabold text-navy">{current.achieved}</div>
            </div>
            <div className="rounded-2xl bg-passit-off border border-passit-border p-4">
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-passit-muted mb-1">
                Merit+
              </div>
              <div className="text-lg font-extrabold text-brand-blue">{current.merit}</div>
            </div>
            <div className="rounded-2xl bg-passit-off border border-passit-border p-4">
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-passit-muted mb-1">
                Excellence
              </div>
              <div className="text-lg font-extrabold text-yellow-600">{current.excellence}</div>
            </div>
          </div>
        </div>

        {/* Endorsement */}
        <div className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-6">
          <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
            Endorsement tracker
          </div>
          <h2 className="font-display text-xl font-extrabold text-navy mb-2">
            Merit / Excellence
          </h2>
          <p className="text-sm text-passit-muted leading-relaxed mb-4">
            Merit endorsement needs 50 credits at Merit or above. Excellence endorsement needs 50 Excellence credits.
          </p>

          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-passit-off border border-passit-border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-navy">Merit endorsement</div>
                <div className="text-xs font-bold text-passit-muted">
                  {current.endorsementGap.merit === 0 ? 'Ready ✅' : `${current.endorsementGap.merit} to go`}
                </div>
              </div>
              <div className="mt-2 text-sm text-passit-muted">
                You have <span className="font-bold text-brand-blue">{current.merit}</span> M/E credits.
              </div>
            </div>

            <div className="rounded-2xl bg-passit-off border border-passit-border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-navy">Excellence endorsement</div>
                <div className="text-xs font-bold text-passit-muted">
                  {current.endorsementGap.excellence === 0 ? 'Ready ✅' : `${current.endorsementGap.excellence} to go`}
                </div>
              </div>
              <div className="mt-2 text-sm text-passit-muted">
                You have <span className="font-bold text-yellow-600">{current.excellence}</span> Excellence credits.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadlines */}
        <div className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-6 lg:col-span-1">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
                Upcoming deadlines
              </div>
              <h2 className="font-display text-xl font-extrabold text-navy">Next up</h2>
            </div>
            <span className="text-xs font-bold text-passit-muted bg-passit-off border border-passit-border px-2.5 py-1 rounded-full">
              {deadlines.length}/3
            </span>
          </div>

          {deadlines.length ? (
            <div className="flex flex-col gap-3">
              {deadlines.map(d => {
                const styles = urgencyColor(d.urgency)
                return (
                  <div key={d.assessment.id} className="rounded-2xl border border-passit-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-navy truncate">
                          {d.assessment.title}
                        </div>
                        <div className="text-xs text-passit-muted mt-1">
                          {d.subject.name} • {d.assessment.credits} credits •{' '}
                          <span className={gradeColor(d.assessment.grade ?? null)}>
                            {d.assessment.is_internal ? 'Internal' : 'External'}
                          </span>
                        </div>
                      </div>
                      <span className={['text-[11px] font-bold px-2.5 py-1 rounded-full', styles.badge].join(' ')}>
                        {formatDaysUntil(d.daysUntil)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={['w-2.5 h-2.5 rounded-full', styles.dot].join(' ')} />
                      <span className="text-xs text-passit-muted">
                        {d.urgency === 'critical'
                          ? 'High urgency — lock a plan today'
                          : d.urgency === 'warning'
                            ? 'Coming up — keep momentum'
                            : 'On track'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-passit-off border border-passit-border p-4 text-sm text-passit-muted">
              No upcoming deadlines yet. Add one in onboarding to get a daily plan.
            </div>
          )}
        </div>

        {/* Daily plan */}
        <div className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
                AI daily study plan
              </div>
              <h2 className="font-display text-xl font-extrabold text-navy">Top 3 tasks for today</h2>
              <p className="text-sm text-passit-muted mt-1">
                Built from your deadlines and gaps — quick, specific, and doable.
              </p>
            </div>
            <Link
              href="/coach"
              className="inline-flex items-center justify-center bg-brand-sky text-brand-blue px-4 py-2.5 rounded-xl text-sm font-bold hover:brightness-95 transition-all no-underline"
            >
              Open AI Coach →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dailyPlan.map((t, idx) => (
              <div key={idx} className="rounded-2xl border border-passit-border bg-passit-off p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-extrabold text-navy leading-snug">
                    {t.title}
                  </div>
                  {t.badge ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-brand-orange bg-white border border-passit-border px-2 py-1 rounded-full">
                      {t.badge}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-passit-muted mt-2 leading-relaxed">
                  {t.hint}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-white border border-passit-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-navy">Want a tighter plan?</div>
              <div className="text-xs text-passit-muted mt-0.5">
                Ask the coach for a Merit/Excellence checklist for your next standard.
              </div>
            </div>
            <Link
              href="/coach"
              className="inline-flex items-center justify-center bg-brand-orange text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-orange-dark transition-colors no-underline"
            >
              Check your readiness →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

