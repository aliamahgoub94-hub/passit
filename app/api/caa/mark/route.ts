import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { response_text, question, rubric, session_id } = await req.json()

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: `You are an NCEA NZ writing assessor. Return ONLY valid JSON:
{"criteria":[{"name":"string","verdict":"met"|"partial"|"missing","note":"string"}],"overall":"string"}
Use NZ English.`,
        messages: [{ role: 'user', content: `Task: ${question}\nRubric: ${rubric}\nResponse: ${response_text}` }]
      })
    })

    const data = await res.json()
    const text = data.content[0].text
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())

    const supabase = createClient()
    await supabase
      .from('practice_sessions')
      .update({ 
        feedback_json: result,
        score_pct: Math.round((result.criteria.filter((c: any) => c.verdict === 'met').length / result.criteria.length) * 100),
        error_state: false
      })
      .eq('id', session_id)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Marking failed' }, { status: 500 })
  }
}
