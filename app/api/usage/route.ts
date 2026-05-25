import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FREE_MESSAGES_PER_DAY } from '@/lib/ncea'

function dateNzYYYYMMDD(now = new Date()): string {
  // en-CA yields YYYY-MM-DD for dates
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

async function getUsageRow(args: { studentId: string; dateNZ: string }) {
  const { studentId, dateNZ } = args
  const supabase = createClient()

  const { data, error } = await supabase
    .from('usage')
    .select('student_id,date,message_count')
    .eq('student_id', studentId)
    .eq('date', dateNZ)
    .maybeSingle()

  if (error) throw error
  return data as { student_id: string; date: string; message_count: number } | null
}

async function incrementUsage(args: { studentId: string; dateNZ: string }) {
  const { studentId, dateNZ } = args
  const supabase = createClient()

  const existing = await getUsageRow({ studentId, dateNZ })
  if (!existing) {
    const { data, error } = await supabase
      .from('usage')
      .insert({ student_id: studentId, date: dateNZ, message_count: 1 })
      .select('student_id,date,message_count')
      .single()
    if (error) throw error
    return data as { student_id: string; date: string; message_count: number }
  }

  const nextCount = (existing.message_count ?? 0) + 1
  const { data, error } = await supabase
    .from('usage')
    .update({ message_count: nextCount })
    .eq('student_id', studentId)
    .eq('date', dateNZ)
    .select('student_id,date,message_count')
    .single()

  if (error) throw error
  return data as { student_id: string; date: string; message_count: number }
}

export async function GET() {
  const supabase = createClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 })
  const user = userData.user
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const dateNZ = dateNzYYYYMMDD()
  const row = await getUsageRow({ studentId: user.id, dateNZ })
  const used = row?.message_count ?? 0
  const remaining = Math.max(0, FREE_MESSAGES_PER_DAY - used)

  return NextResponse.json({
    dateNZ,
    limit: FREE_MESSAGES_PER_DAY,
    used,
    remaining,
  })
}

export async function POST() {
  const supabase = createClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 })
  const user = userData.user
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const dateNZ = dateNzYYYYMMDD()
  const row = await incrementUsage({ studentId: user.id, dateNZ })
  const used = row?.message_count ?? 0
  const remaining = Math.max(0, FREE_MESSAGES_PER_DAY - used)

  return NextResponse.json({
    dateNZ,
    limit: FREE_MESSAGES_PER_DAY,
    used,
    remaining,
  })
}

