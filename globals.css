import type { Assessment, CreditSummary, DeadlineItem, NceaLevel } from '@/types'

export const CREDITS_TO_PASS = 80
export const CREDITS_FOR_ENDORSEMENT = 50
export const CREDITS_FOR_EXCELLENCE_ENDORSEMENT = 50
export const FREE_MESSAGES_PER_DAY = 5

// ─── Core credit calculations ─────────────────────────────────

export function calculateCreditSummary(
  assessments: Assessment[],
  level: NceaLevel
): CreditSummary {
  const levelAssessments = assessments.filter(a => a.subject?.level === level)

  let earned = 0
  let achieved = 0
  let merit = 0
  let excellence = 0

  for (const a of levelAssessments) {
    if (!a.grade || a.grade === 'Not Achieved') continue
    earned += a.credits
    if (a.grade === 'Achieved') achieved += a.credits
    if (a.grade === 'Merit') { merit += a.credits; achieved += a.credits }
    if (a.grade === 'Excellence') { excellence += a.credits; merit += a.credits; achieved += a.credits }
  }

  // Endorsement: need 50 credits at Merit or above (with ≥20 at that level)
  const meritAndAbove = merit // already cumulative from above
  const endorsementMeritGap = Math.max(0, CREDITS_FOR_ENDORSEMENT - meritAndAbove)
  const endorsementExcellenceGap = Math.max(0, CREDITS_FOR_EXCELLENCE_ENDORSEMENT - excellence)

  return {
    level,
    earned,
    needed: Math.max(0, CREDITS_TO_PASS - earned),
    achieved,
    merit: meritAndAbove,
    excellence,
    passed: earned >= CREDITS_TO_PASS,
    endorsementGap: {
      merit: endorsementMeritGap,
      excellence: endorsementExcellenceGap,
    },
  }
}

// ─── Deadline sorting ─────────────────────────────────────────

export function getDeadlines(assessments: Assessment[]): DeadlineItem[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return assessments
    .filter(a => a.due_date && !a.grade)
    .map(a => {
      const due = new Date(a.due_date!)
      const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const urgency: DeadlineItem['urgency'] =
        daysUntil <= 7 ? 'critical' :
        daysUntil <= 21 ? 'warning' : 'safe'

      return {
        assessment: a,
        subject: a.subject!,
        daysUntil,
        urgency,
      }
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 6)
}

// ─── AI system prompt builder ─────────────────────────────────

export function buildSystemPrompt(data: {
  profile: { ncea_level: NceaLevel }
  summaries: CreditSummary[]
  subjects: { name: string; level: NceaLevel }[]
  deadlines: DeadlineItem[]
}): string {
  const { profile, summaries, subjects, deadlines } = data
  const current = summaries.find(s => s.level === profile.ncea_level)

  const subjectList = subjects
    .map(s => s.name)
    .join(', ')

  const deadlineText = deadlines.length
    ? deadlines
        .slice(0, 3)
        .map(d => `${d.assessment.title} (${d.subject.name}, ${d.daysUntil} days)`)
        .join('; ')
    : 'no upcoming deadlines'

  return `You are Passit, a friendly AI study coach for NZ students doing NCEA.

STUDENT CONTEXT:
- NCEA Level: ${profile.ncea_level}
- Subjects: ${subjectList || 'not set yet'}
- Credits earned this level: ${current?.earned ?? 0} / 80 needed
- Achieved: ${current?.achieved ?? 0} | Merit: ${current?.merit ?? 0} | Excellence: ${current?.excellence ?? 0}
- Certificate status: ${current?.passed ? 'PASSED ✅' : `needs ${current?.needed ?? 80} more credits`}
- Merit endorsement: ${current?.endorsementGap.merit === 0 ? 'achieved ✅' : `needs ${current?.endorsementGap.merit} more M/E credits`}
- Nearest deadlines: ${deadlineText}

NCEA KNOWLEDGE:
- You know every Achievement Standard deeply: AS numbers, credit values, Achieved/Merit/Excellence criteria
- Internal assessments are school-marked; externals are November exams
- Certificate requires 80 credits. Merit endorsement: 50+ credits at Merit or above. Excellence endorsement: 50+ at Excellence.
- University Entrance (Level 3): 42 credits at L3 in approved subjects + literacy + numeracy
- Literacy co-req: 10 credits in specific English/Te Reo standards. Numeracy: 10 credits in specific Maths standards.

BEHAVIOUR:
- Be direct, warm, and encouraging — NZ student voice
- Give specific NCEA advice, never generic study tips
- Use "kia ora" or "kia pai" occasionally but naturally
- Keep responses concise: 2–4 sentences unless explaining a concept
- Always reference the student's actual situation above
- If they ask about a topic, explain it at the right NCEA level with real AS context`
}

// ─── Utility ─────────────────────────────────────────────────

export function urgencyColor(urgency: DeadlineItem['urgency']) {
  return {
    critical: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', shadow: 'shadow-red-500/30' },
    warning:  { dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', shadow: '' },
    safe:     { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700', shadow: '' },
  }[urgency]
}

export function gradeColor(grade: string | null) {
  if (grade === 'Excellence') return 'text-yellow-600'
  if (grade === 'Merit') return 'text-brand-blue'
  if (grade === 'Achieved') return 'text-brand-lime'
  return 'text-passit-muted'
}

export function formatDaysUntil(days: number): string {
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  if (days < 14) return `${days} days`
  const weeks = Math.round(days / 7)
  return `${weeks} week${weeks > 1 ? 's' : ''}`
}
