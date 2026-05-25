import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('id, student_email, standard, score_pct, feedback_json, created_at')
    .eq('student_email', email)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('practice_sessions query error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }

  return NextResponse.json({ sessions: data ?? [] })
}
