import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPromptForStandard } from '@/lib/caa-feedback'
import type { CaaStandard } from '@/types'

const VALID_STANDARDS: CaaStandard[] = ['US32405', 'US32403', 'US32406']

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null) as null | {
    standard?: string
    sessionId?: string
    studentWork?: any
  }

  if (!body?.standard || !body?.sessionId || !body?.studentWork) {
    return NextResponse.json(
      { error: 'Missing required fields: standard, sessionId, studentWork' },
      { status: 400 }
    )
  }

  const { standard, sessionId, studentWork } = body

  if (!VALID_STANDARDS.includes(standard as CaaStandard)) {
    return NextResponse.json({ error: 'Invalid standard.' }, { status: 400 })
  }

  const { data: session } = await supabase
    .from('caa_sessions')
    .select('id, student_id')
    .eq('id', sessionId)
    .eq('student_id', userData.user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  }

  const systemPrompt = getPromptForStandard(standard as CaaStandard)

  const userMessage = typeof studentWork === 'string'
    ? studentWork
    : JSON.stringify(studentWork)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    return NextResponse.json(
      { error: 'Anthropic API error', detail: errBody },
      { status: 502 }
    )
  }

  const data = await response.json()
  const text = data.content[0].text

  let feedback: any
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text)
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI feedback.', raw: text },
      { status: 500 }
    )
  }

  if (standard === 'US32405') {
    const criteria = feedback.criteria
    if (criteria) {
      const rows = Object.entries(criteria).map(([criterion, data]: [string, any]) => ({
        session_id: sessionId,
        criterion,
        verdict: data.verdict,
        feedback: data.feedback,
      }))
      await supabase.from('writing_results').insert(rows)

      const verdictScores = { met: 100, partial: 50, missing: 0 }
      const scores = rows.map(r => verdictScores[r.verdict as keyof typeof verdictScores] ?? 0)
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

      await supabase
        .from('caa_sessions')
        .update({ score: avgScore, total: 100, completed: true })
        .eq('id', sessionId)
    }
  } else if (standard === 'US32403') {
    const questions = feedback.questions
    if (questions) {
      const rows = questions.map((q: any) => ({
        session_id: sessionId,
        question_number: q.question_number,
        outcome: q.outcome,
        correct: q.correct,
        feedback: q.feedback,
      }))
      await supabase.from('reading_results').insert(rows)

      const score = feedback.score ?? questions.filter((q: any) => q.correct).length
      const total = feedback.total ?? questions.length

      await supabase
        .from('caa_sessions')
        .update({ score, total, completed: true })
        .eq('id', sessionId)
    }
  } else if (standard === 'US32406') {
    const questions = feedback.questions
    if (questions) {
      const rows = questions.map((q: any) => ({
        session_id: sessionId,
        question_number: q.question_number,
        outcome: q.outcome,
        correct: q.correct,
        feedback: q.feedback,
      }))
      await supabase.from('numeracy_results').insert(rows)

      const score = feedback.score ?? questions.filter((q: any) => q.correct).length
      const total = feedback.total ?? questions.length

      await supabase
        .from('caa_sessions')
        .update({ score, total, completed: true })
        .eq('id', sessionId)
    }
  }

  return NextResponse.json({ feedback })
}
