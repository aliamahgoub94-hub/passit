import { NextRequest, NextResponse } from 'next/server'
import {
  feedbackFromWeakSkills,
  matchSkills,
  normalizeWritingResult,
} from '@/lib/caa-marking-lookup.js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

async function markWritingWithAnthropic(
  apiKey: string,
  body: {
    response_text?: string
    question?: string
    task?: string
    rubric?: string | string[]
  }
) {
  const question = body.question || body.task || ''
  const rubric = Array.isArray(body.rubric)
    ? body.rubric.join(', ')
    : body.rubric || ''
  const responseText = body.response_text || ''

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are an NCEA NZ writing assessor. Given a student's response and a rubric, return ONLY valid JSON in this exact format:
{"criteria":[{"name":"criterion name","verdict":"met"|"partial"|"missing","note":"one short sentence max"}],"overall":"One sentence overall feedback, specific and constructive."}
Be honest but encouraging. Use NZ English.`,
      messages: [
        {
          role: 'user',
          content: `Task: ${question}\nRubric criteria: ${rubric}\nStudent response:\n${responseText}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${errText}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse JSON from AI response')
  return normalizeWritingResult(JSON.parse(jsonMatch[0]))
}

export async function POST(req: NextRequest) {
  let sessionId: string | undefined

  try {
    const body = await req.json()
    sessionId = body.session_id
    const {
      response_text,
      question,
      task,
      rubric,
      session_id,
      weak_skills,
      standard,
      backfill,
    } = body

    const admin = getSupabaseAdmin()
    const isWriting =
      !backfill &&
      response_text &&
      String(response_text).trim() &&
      (standard === '32405' || standard === 32405)

    let result: ReturnType<typeof normalizeWritingResult> | ReturnType<
      typeof feedbackFromWeakSkills
    > | null = null

    if (isWriting) {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { ok: false, error: 'ANTHROPIC_API_KEY is not configured' },
          { status: 500 }
        )
      }
      result = await markWritingWithAnthropic(apiKey, {
        response_text,
        question,
        task,
        rubric,
      })
    } else if (Array.isArray(weak_skills) && standard) {
      const matched = matchSkills(weak_skills, standard)
      if (!matched.length && !backfill) {
        return NextResponse.json(
          { ok: false, error: 'No matching feedback for provided weak_skills' },
          { status: 400 }
        )
      }
      result = feedbackFromWeakSkills(
        standard,
        weak_skills,
        body.score_pct != null ? Number(body.score_pct) : null
      )
    } else {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Provide response_text for writing marking, or weak_skills + standard for lookup feedback',
        },
        { status: 400 }
      )
    }

    if (session_id && admin && result) {
      await admin
        .from('practice_sessions')
        .update({
          feedback_json: result,
          score_pct: result.score_pct,
          correct: result.correct,
          total: result.total,
          error_state: false,
        })
        .eq('id', session_id)
    }

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    const admin = getSupabaseAdmin()

    if (sessionId && admin) {
      await admin
        .from('practice_sessions')
        .update({ error_state: true })
        .eq('id', sessionId)
        .catch(() => {})
    }

    const message = error instanceof Error ? error.message : 'Marking failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
