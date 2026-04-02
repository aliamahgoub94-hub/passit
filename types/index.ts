// ─── Database types ───────────────────────────────────────────

export type NceaLevel = 1 | 2 | 3
export type Grade = 'Achieved' | 'Merit' | 'Excellence' | 'Not Achieved' | null

export interface Profile {
  id: string
  ncea_level: NceaLevel
  is_pro: boolean
  created_at: string
}

export interface Subject {
  id: string
  student_id: string
  name: string
  level: NceaLevel
  created_at: string
}

export interface Assessment {
  id: string
  student_id: string
  subject_id: string
  as_number: string | null
  title: string
  credits: number
  grade: Grade
  is_internal: boolean
  due_date: string | null
  created_at: string
  // joined
  subject?: Subject
}

export interface UsageRecord {
  student_id: string
  date: string
  message_count: number
}

// ─── Computed / UI types ──────────────────────────────────────

export interface CreditSummary {
  level: NceaLevel
  earned: number
  needed: number          // 80 for certificate
  achieved: number
  merit: number
  excellence: number
  passed: boolean
  endorsementGap: {       // credits needed to reach endorsement
    merit: number         // need 50 M/E total
    excellence: number    // need 50 E total
  }
}

export interface DeadlineItem {
  assessment: Assessment
  subject: Subject
  daysUntil: number
  urgency: 'critical' | 'warning' | 'safe'
}

export interface DashboardData {
  profile: Profile
  summaries: CreditSummary[]
  assessments: Assessment[]
  subjects: Subject[]
  deadlines: DeadlineItem[]
  totalCredits: number
  currentLevelSummary: CreditSummary
}

// ─── Chat ─────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
