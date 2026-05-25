import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/lib/supabase/server'
import {
  buildSystemPrompt,
  calculateCreditSummary,
  FREE_MESSAGES_PER_DAY,
  getDeadlines,
} from '@/lib/ncea'
import type { Assessment, NceaLevel, Subject } from '@/types'

function dateNzYYYYMMDD(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

async function assertUnderFreeLimit(args: { studentId: string }) {
  const { studentId } = args
  const supabase = createClient()
  const dateNZ = dateNzYYYYMMDD()

  const { data: existing, error: readErr } = await supabase
    .from('usage')
    .select('message_count')
    .eq('student_id', studentId)
    .eq('date', dateNZ)
    .maybeSingle()

  if (readErr) throw readErr

  const used = existing?.message_count ?? 0
  const remainingBefore = Math.max(0, FREE_MESSAGES_PER_DAY - used)
  if (remainingBefore <= 0) {
    return { allowed: false as const, remaining: 0, used, dateNZ }
  }

  // Increment (simple approach; acceptable for low-concurrency)
  if (!existing) {
    const { error: insErr } = await supabase
      .from('usage')
      .insert({ student_id: studentId, date: dateNZ, message_count: 1 })
    if (insErr) throw insErr
    return { allowed: true as const, remaining: FREE_MESSAGES_PER_DAY - 1, used: 1, dateNZ }
  }

  const { error: updErr } = await supabase
    .from('usage')
    .update({ message_count: used + 1 })
    .eq('student_id', studentId)
    .eq('date', dateNZ)

  if (updErr) throw updErr
  return { allowed: true as const, remaining: Math.max(0, FREE_MESSAGES_PER_DAY - (used + 1)), used: used + 1, dateNZ }
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 })
  const user = userData.user
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await req.json().catch(() => null) as null | { messages?: any[] }
  const messages = Array.isArray(body?.messages) ? body!.messages : null
  if (!messages) return NextResponse.json({ error: 'Invalid payload: expected { messages: [] }.' }, { status: 400 })

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id,ncea_level,onboarding_complete,is_pro')
    .eq('id', user.id)
    .maybeSingle()

  const profile = {
    ncea_level: (profileRow?.ncea_level ?? 1) as NceaLevel,
    onboarding_complete: Boolean(profileRow?.onboarding_complete),
    is_pro: Boolean((profileRow as any)?.is_pro ?? false),
  }

  if (!profile.onboarding_complete) {
    return NextResponse.json(
      { error: 'Onboarding not complete. Finish setup first.' },
      { status: 409 }
    )
  }

  if (!profile.is_pro) {
    const limit = await assertUnderFreeLimit({ studentId: user.id })
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Daily message limit reached.', remaining: 0, limit: FREE_MESSAGES_PER_DAY, dateNZ: limit.dateNZ },
        { status: 429 }
      )
    }
  }

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
  const deadlines = getDeadlines(assessments).slice(0, 3)

  const system = buildSystemPrompt({
    profile: { ncea_level: profile.ncea_level },
    summaries,
    subjects: (subjects as Subject[]).map(s => ({ name: s.name, level: s.level as NceaLevel })),
    deadlines,
  })

  // Keep context bounded
  const contextMessages = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20)

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system,
    messages: contextMessages,
    maxTokens: 900,
  })

  return result.toDataStreamResponse()
}

