'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { NceaLevel } from '@/types'

type Step = 1 | 2 | 3 | 4
type ResultGrade = 'Achieved' | 'Merit' | 'Excellence'

const SUBJECT_OPTIONS = [
  'English',
  'Mathematics',
  'Science',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Geography',
  'Economics',
  'Accounting',
  'Business Studies',
  'Digital Technologies',
  'Computer Science',
  'Health',
  'Physical Education',
  'Art',
  'Design',
  'Photography',
  'Music',
  'Drama',
  'Te Reo Māori',
  'Japanese',
  'French',
  'Spanish',
] as const

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function isValidDateYYYYMMDD(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00`)
  return !Number.isNaN(d.getTime())
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [level, setLevel] = useState<NceaLevel>(2)

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [results, setResults] = useState<Array<{
    subjectName: string
    asNumber: string
    title: string
    credits: number
    grade: ResultGrade
    isInternal: boolean
    dueDate: string
  }>>([])

  const [deadlines, setDeadlines] = useState<Array<{
    subjectName: string
    title: string
    asNumber: string
    credits: number
    dueDate: string
    isInternal: boolean
  }>>([])

  const progressPct = (step / 4) * 100

  async function next() {
    setError(null)
    if (step === 1) {
      setStep(2)
      return
    }
    if (step === 2) {
      if (!selectedSubjects.length) {
        setError('Add at least one subject to continue.')
        return
      }
      setStep(3)
      return
    }
    if (step === 3) {
      setStep(4)
      return
    }
  }

  function back() {
    setError(null)
    setStep(s => (s > 1 ? ((s - 1) as Step) : s))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw userErr
      const user = userData.user
      if (!user) throw new Error('Not signed in.')

      // 1) Profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ ncea_level: level, onboarding_complete: true })
        .eq('id', user.id)

      if (profileErr) throw profileErr

      // 2) Subjects (insert-only)
      const subjectRows = selectedSubjects.map(name => ({
        student_id: user.id,
        name,
        level,
      }))

      const { data: insertedSubjects, error: subjErr } = await supabase
        .from('subjects')
        .insert(subjectRows)
        .select('id,name')

      if (subjErr) throw subjErr

      const subjectIdByName = new Map<string, string>(
        (insertedSubjects ?? []).map((s: any) => [s.name as string, s.id as string])
      )

      // 3) Results (Step 3) -> graded assessments
      const resultRows = results
        .map(r => {
          const subjectId = subjectIdByName.get(r.subjectName)
          if (!subjectId) return null
          if (!r.title.trim()) return null
          if (!r.credits || r.credits < 1) return null
          const dueDate = r.dueDate.trim()
          if (dueDate && !isValidDateYYYYMMDD(dueDate)) return null

          return {
            student_id: user.id,
            subject_id: subjectId,
            as_number: r.asNumber.trim() || null,
            title: r.title.trim(),
            credits: r.credits,
            grade: r.grade,
            is_internal: r.isInternal,
            due_date: dueDate || null,
          }
        })
        .filter(Boolean) as any[]

      if (resultRows.length) {
        const { error: resErr } = await supabase.from('assessments').insert(resultRows)
        if (resErr) throw resErr
      }

      // 4) Deadlines (Step 4) -> ungraded assessments
      const deadlineRows = deadlines
        .map(d => {
          const subjectId = subjectIdByName.get(d.subjectName)
          if (!subjectId) return null
          if (!d.title.trim()) return null
          if (!d.credits || d.credits < 1) return null
          if (!isValidDateYYYYMMDD(d.dueDate)) return null
          return {
            student_id: user.id,
            subject_id: subjectId,
            as_number: d.asNumber.trim() || null,
            title: d.title.trim(),
            credits: d.credits,
            grade: null,
            is_internal: d.isInternal,
            due_date: d.dueDate,
          }
        })
        .filter(Boolean) as any[]

      if (deadlineRows.length) {
        const { error: dlErr } = await supabase.from('assessments').insert(deadlineRows)
        if (dlErr) throw dlErr
      }

      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong while saving.')
    } finally {
      setSaving(false)
    }
  }

  function addSubject(name: string) {
    if (!name) return
    if (selectedSubjects.includes(name)) return
    setSelectedSubjects(prev => [...prev, name])
  }

  function removeSubject(name: string) {
    setSelectedSubjects(prev => prev.filter(s => s !== name))
    setResults(prev => prev.filter(r => r.subjectName !== name))
    setDeadlines(prev => prev.filter(d => d.subjectName !== name))
  }

  function addResultRow() {
    const defaultSubject = selectedSubjects[0] ?? ''
    setResults(prev => [
      ...prev,
      {
        subjectName: defaultSubject,
        asNumber: '',
        title: '',
        credits: 4,
        grade: 'Achieved',
        isInternal: true,
        dueDate: '',
      },
    ])
  }

  function addDeadlineRow() {
    const defaultSubject = selectedSubjects[0] ?? ''
    setDeadlines(prev => [
      ...prev,
      {
        subjectName: defaultSubject,
        title: '',
        asNumber: '',
        credits: 4,
        dueDate: '',
        isInternal: true,
      },
    ])
  }

  return (
    <div className="max-w-3xl">
      <div className="bg-white border border-passit-border rounded-2xl shadow-brand-sm p-6">
        <div className="text-[11px] font-bold uppercase tracking-[.14em] text-brand-orange mb-2">
          Onboarding
        </div>
        <h1 className="font-display text-3xl font-extrabold text-navy tracking-tight">
          Let’s set up your readiness
        </h1>
        <p className="text-passit-muted text-sm mt-1">
          This takes about 2 minutes. You can edit it later.
        </p>

        <div className="mt-5">
          <div className="flex justify-between text-[11px] font-bold text-passit-muted mb-2">
            <span>Step {step} of 4</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-3 rounded-full bg-passit-off border border-passit-border overflow-hidden">
            <div className="h-full rounded-full bg-brand-blue" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {error ? (
          <div className="mt-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        ) : null}

        {/* Step 1 */}
        {step === 1 ? (
          <div className="mt-6">
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
              Step 1
            </div>
            <h2 className="font-display text-xl font-extrabold text-navy mb-2">
              Select your NCEA level
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {[1, 2, 3].map(n => {
                const v = n as NceaLevel
                const active = level === v
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLevel(v)}
                    className={cx(
                      'rounded-2xl border px-4 py-4 text-left transition-all',
                      active
                        ? 'border-brand-blue bg-brand-sky shadow-brand-sm'
                        : 'border-passit-border bg-white hover:bg-passit-off'
                    )}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted">
                      NCEA
                    </div>
                    <div className="font-display text-2xl font-extrabold text-navy mt-1">
                      Level {v}
                    </div>
                    <div className="text-xs text-passit-muted mt-1">
                      Track credits + deadlines for Level {v}.
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Step 2 */}
        {step === 2 ? (
          <div className="mt-6">
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
              Step 2
            </div>
            <h2 className="font-display text-xl font-extrabold text-navy mb-2">
              Add your subjects
            </h2>
            <p className="text-sm text-passit-muted">
              Pick the subjects you’re taking at Level {level}.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <select
                className="flex-1 px-4 py-3 rounded-xl border border-passit-border text-sm text-passit-text bg-white"
                defaultValue=""
                onChange={e => {
                  const val = e.target.value
                  if (val) addSubject(val)
                  e.currentTarget.value = ''
                }}
              >
                <option value="" disabled>
                  Select a subject…
                </option>
                {SUBJECT_OPTIONS.map(s => (
                  <option key={s} value={s} disabled={selectedSubjects.includes(s)}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSubjects.length ? (
                selectedSubjects.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => removeSubject(s)}
                    className="inline-flex items-center gap-2 bg-passit-off border border-passit-border px-3 py-2 rounded-full text-sm font-semibold text-navy hover:border-brand-blue transition-colors"
                    title="Remove subject"
                  >
                    {s}
                    <span className="text-passit-muted">×</span>
                  </button>
                ))
              ) : (
                <div className="text-sm text-passit-muted">
                  No subjects yet. Add at least one to continue.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Step 3 */}
        {step === 3 ? (
          <div className="mt-6">
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
              Step 3
            </div>
            <h2 className="font-display text-xl font-extrabold text-navy mb-2">
              Results earned so far
            </h2>
            <p className="text-sm text-passit-muted">
              Add standards you’ve already finished. Each one will be saved as an assessment result. (Optional)
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {results.map((r, idx) => (
                <div key={idx} className="rounded-2xl border border-passit-border bg-white p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-1">
                        Subject
                      </div>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-passit-border text-sm bg-white"
                        value={r.subjectName}
                        onChange={e => {
                          const v = e.target.value
                          setResults(prev => prev.map((x, i) => (i === idx ? { ...x, subjectName: v } : x)))
                        }}
                      >
                        {selectedSubjects.map(s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-1">
                        Standard / title
                      </div>
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-passit-border text-sm"
                        placeholder="e.g. AS 91261 Algebra (or: Writing portfolio)"
                        value={r.title}
                        onChange={e => {
                          const v = e.target.value
                          setResults(prev => prev.map((x, i) => (i === idx ? { ...x, title: v } : x)))
                        }}
                      />
                      <div className="mt-2 flex gap-2">
                        <input
                          className="flex-1 px-3 py-2 rounded-xl border border-passit-border text-sm"
                          placeholder="AS number (optional)"
                          value={r.asNumber}
                          onChange={e => {
                            const v = e.target.value
                            setResults(prev => prev.map((x, i) => (i === idx ? { ...x, asNumber: v } : x)))
                          }}
                        />
                        <input
                          className="w-24 px-3 py-2 rounded-xl border border-passit-border text-sm"
                          type="number"
                          min={1}
                          value={r.credits}
                          onChange={e => {
                            const v = Number(e.target.value)
                            setResults(prev => prev.map((x, i) => (i === idx ? { ...x, credits: Number.isFinite(v) ? v : 4 } : x)))
                          }}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-1">
                        Grade
                      </div>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-passit-border text-sm bg-white"
                        value={r.grade}
                        onChange={e => {
                          const v = e.target.value as ResultGrade
                          setResults(prev => prev.map((x, i) => (i === idx ? { ...x, grade: v } : x)))
                        }}
                      >
                        <option value="Achieved">Achieved</option>
                        <option value="Merit">Merit</option>
                        <option value="Excellence">Excellence</option>
                      </select>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
                          <input
                            type="checkbox"
                            checked={r.isInternal}
                            onChange={e => {
                              const v = e.target.checked
                              setResults(prev => prev.map((x, i) => (i === idx ? { ...x, isInternal: v } : x)))
                            }}
                          />
                          Internal
                        </label>
                        <input
                          className="px-3 py-2 rounded-xl border border-passit-border text-sm"
                          type="date"
                          value={r.dueDate}
                          onChange={e => {
                            const v = e.target.value
                            setResults(prev => prev.map((x, i) => (i === idx ? { ...x, dueDate: v } : x)))
                          }}
                          title="Due date (optional)"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setResults(prev => prev.filter((_, i) => i !== idx))}
                        className="mt-2 text-sm font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addResultRow}
                disabled={!selectedSubjects.length}
                className="inline-flex items-center justify-center bg-white border border-passit-border text-navy py-3 rounded-xl text-sm font-bold hover:border-brand-blue hover:text-brand-blue transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                + Add a result
              </button>
            </div>
          </div>
        ) : null}

        {/* Step 4 */}
        {step === 4 ? (
          <div className="mt-6">
            <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-2">
              Step 4
            </div>
            <h2 className="font-display text-xl font-extrabold text-navy mb-2">
              Add upcoming deadlines
            </h2>
            <p className="text-sm text-passit-muted">
              Add the next few internals or externals you’re working towards. (Optional)
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {deadlines.map((d, idx) => (
                <div key={idx} className="rounded-2xl border border-passit-border bg-white p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-1">
                        Subject
                      </div>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-passit-border text-sm bg-white"
                        value={d.subjectName}
                        onChange={e => {
                          const v = e.target.value
                          setDeadlines(prev => prev.map((x, i) => (i === idx ? { ...x, subjectName: v } : x)))
                        }}
                      >
                        {selectedSubjects.map(s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-1">
                        Standard / title
                      </div>
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-passit-border text-sm"
                        placeholder="e.g. AS 91261 Algebra (or: Writing portfolio)"
                        value={d.title}
                        onChange={e => {
                          const v = e.target.value
                          setDeadlines(prev => prev.map((x, i) => (i === idx ? { ...x, title: v } : x)))
                        }}
                      />
                      <div className="mt-2 flex gap-2">
                        <input
                          className="flex-1 px-3 py-2 rounded-xl border border-passit-border text-sm"
                          placeholder="AS number (optional)"
                          value={d.asNumber}
                          onChange={e => {
                            const v = e.target.value
                            setDeadlines(prev => prev.map((x, i) => (i === idx ? { ...x, asNumber: v } : x)))
                          }}
                        />
                        <input
                          className="w-24 px-3 py-2 rounded-xl border border-passit-border text-sm"
                          type="number"
                          min={1}
                          value={d.credits}
                          onChange={e => {
                            const v = Number(e.target.value)
                            setDeadlines(prev => prev.map((x, i) => (i === idx ? { ...x, credits: Number.isFinite(v) ? v : 4 } : x)))
                          }}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <div className="text-[11px] font-bold uppercase tracking-[.14em] text-passit-muted mb-1">
                        Due date
                      </div>
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-passit-border text-sm"
                        type="date"
                        value={d.dueDate}
                        onChange={e => {
                          const v = e.target.value
                          setDeadlines(prev => prev.map((x, i) => (i === idx ? { ...x, dueDate: v } : x)))
                        }}
                      />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
                          <input
                            type="checkbox"
                            checked={d.isInternal}
                            onChange={e => {
                              const v = e.target.checked
                              setDeadlines(prev => prev.map((x, i) => (i === idx ? { ...x, isInternal: v } : x)))
                            }}
                          />
                          Internal
                        </label>
                        <button
                          type="button"
                          onClick={() => setDeadlines(prev => prev.filter((_, i) => i !== idx))}
                          className="text-sm font-bold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addDeadlineRow}
                disabled={!selectedSubjects.length}
                className="inline-flex items-center justify-center bg-white border border-passit-border text-navy py-3 rounded-xl text-sm font-bold hover:border-brand-blue hover:text-brand-blue transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                + Add a deadline
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 1 || saving}
            className="px-5 py-3 rounded-xl text-sm font-bold border border-passit-border bg-white text-navy hover:bg-passit-off transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-brand-orange text-white hover:bg-brand-orange-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-brand-orange text-white hover:bg-brand-orange-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Finish setup →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

