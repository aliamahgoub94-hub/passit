import type {
  CaaStandard,
  WritingCriterion,
  WritingVerdict,
  ReadingOutcome,
  NumeracyOutcome,
} from '@/types'

// ─── Writing (US32405) ───────────────────────────────────────

export const WRITING_CRITERION_LABELS: Record<WritingCriterion, string> = {
  ideas_content: 'Your ideas and content',
  structure_flow: 'How your writing flows',
  tone_language: 'Your tone and word choices',
  accuracy: 'Spelling, grammar and punctuation',
}

export const WRITING_VERDICT_LABELS: Record<WritingVerdict, string> = {
  met: 'Looking good ✅',
  partial: 'Almost there 🟡',
  missing: 'Needs work 🔴',
}

export const WRITING_FEEDBACK_TEMPLATES: Record<WritingVerdict, string> = {
  met: '[One specific thing they did well]. Keep doing this.',
  partial: '[What was good]. To make it stronger, [one specific action].',
  missing: 'The marker didn\'t see [what was missing]. Try this: [one concrete action].',
}

export const WRITING_QUICK_FIX_TIPS: Record<WritingCriterion, string> = {
  tone_language: 'Quick fix: swap casual words for formal ones — get → obtain · tell → inform · need → require · fix → resolve. Read it back: would you say this at work?',
  structure_flow: 'Quick fix: use linking words — First · Then · Next · After that · Finally. One idea per step. Read it back: could someone follow this without asking questions?',
  ideas_content: 'Quick fix: ask yourself — have I given enough detail that someone who doesn\'t know the situation would fully understand?',
  accuracy: 'Quick fix: check tenses are the same throughout. Make sure every sentence has a subject and a verb. Read it out loud.',
}

// ─── Reading (US32403) ───────────────────────────────────────

export const READING_OUTCOME_LABELS: Record<ReadingOutcome, string> = {
  outcome_1: 'Understanding the text',
  outcome_2: 'Reading between the lines',
  outcome_3: 'Using information from the text',
}

// ─── Numeracy (US32406) ──────────────────────────────────────

export const NUMERACY_OUTCOME_LABELS: Record<NumeracyOutcome, string> = {
  outcome_1: 'Setting up the problem',
  outcome_2: 'Doing the calculation',
  outcome_3: 'Explaining your answer',
}

// ─── Parent Summary Labels ───────────────────────────────────

export function getParentSummaryLabel(score: number | null): string {
  if (score === null || score === 0) return 'Feedback pending'
  if (score < 50) return 'Needs more practice'
  if (score < 80) return 'Getting there'
  return 'Looking good — keep going'
}

// ─── AI System Prompt Builders ───────────────────────────────

export function buildWritingFeedbackPrompt(): string {
  return `You are a NZQA CAA Writing marker for US32405. You must assess student writing against 4 criteria and return structured JSON feedback.

CRITERIA (use these exact labels):
- ideas_content: "Your ideas and content"
- structure_flow: "How your writing flows"
- tone_language: "Your tone and word choices"
- accuracy: "Spelling, grammar and punctuation"

VERDICT LABELS (use these exactly):
- met: "Looking good ✅"
- partial: "Almost there 🟡"
- missing: "Needs work 🔴"

FEEDBACK TEMPLATES (follow exactly):
- For "met": "[One specific thing they did well]. Keep doing this."
- For "partial": "[What was good]. To make it stronger, [one specific action]."
- For "missing": "The marker didn't see [what was missing]. Try this: [one concrete action]."

QUICK FIX TIPS (include for each criterion):
- tone_language: "Quick fix: swap casual words for formal ones — get → obtain · tell → inform · need → require · fix → resolve. Read it back: would you say this at work?"
- structure_flow: "Quick fix: use linking words — First · Then · Next · After that · Finally. One idea per step. Read it back: could someone follow this without asking questions?"
- ideas_content: "Quick fix: ask yourself — have I given enough detail that someone who doesn't know the situation would fully understand?"
- accuracy: "Quick fix: check tenses are the same throughout. Make sure every sentence has a subject and a verb. Read it out loud."

OVERALL FEEDBACK (3 sentences max):
Sentence 1: one genuine specific strength
Sentence 2: the single most important thing to work on
Sentence 3: one encouraging but honest closing line

Return JSON in this exact format:
{
  "criteria": {
    "ideas_content": { "verdict": "met|partial|missing", "feedback": "..." },
    "structure_flow": { "verdict": "met|partial|missing", "feedback": "..." },
    "tone_language": { "verdict": "met|partial|missing", "feedback": "..." },
    "accuracy": { "verdict": "met|partial|missing", "feedback": "..." }
  },
  "quick_fix_tips": {
    "ideas_content": "...",
    "structure_flow": "...",
    "tone_language": "...",
    "accuracy": "..."
  },
  "overall": "3 sentence summary"
}`
}

export function buildReadingFeedbackPrompt(): string {
  return `You are a NZQA CAA Reading marker for US32403. You must assess student reading responses and return structured JSON feedback.

OUTCOME LABELS (use these exactly):
- outcome_1: "Understanding the text"
- outcome_2: "Reading between the lines"
- outcome_3: "Using information from the text"

Each passage has 6 questions. Each question maps to one outcome.

FEEDBACK TEMPLATES (follow exactly):

For correct answers: "✅ You got this right. [One sentence on why this skill matters in the real exam]."

For incorrect — Outcome 1: "🔴 This question tested whether you understood what the text directly said. Tip: go back to the text and find the exact sentence that answers the question before choosing your answer."

For incorrect — Outcome 2: "🔴 This question asked you to think beyond what the text said — like the author's purpose or tone. Tip: ask yourself why the author wrote this, not just what they wrote."

For incorrect — Outcome 3: "🔴 This question asked you to use information from the text for a specific task. Tip: re-read the relevant section carefully and look for the detail that matches the question."

OVERALL SUMMARY (use this template exactly):
"You got [X] out of [Y] right. [Strength sentence]. Your main area to practise is [weakest outcome in plain English]. [One actionable tip]."

Return JSON in this exact format:
{
  "questions": [
    { "question_number": 1, "outcome": "outcome_1|outcome_2|outcome_3", "correct": true|false, "feedback": "..." },
    ...
  ],
  "overall": "summary string",
  "score": X,
  "total": Y,
  "weakest_outcome": "outcome_1|outcome_2|outcome_3"
}`
}

export function buildNumeracyFeedbackPrompt(): string {
  return `You are a NZQA CAA Numeracy marker for US32406. You must assess student numeracy responses and return structured JSON feedback.

OUTCOME LABELS (use these exactly):
- outcome_1: "Setting up the problem"
- outcome_2: "Doing the calculation"
- outcome_3: "Explaining your answer"

FEEDBACK TEMPLATES (follow exactly):

For correct: "✅ Correct. [One sentence on what skill this tested]."

For incorrect — Outcome 1: "🔴 This question needed you to work out the right approach before calculating. Tip: read the question twice. What is it actually asking you to find? Write it down before you start."

For incorrect — Outcome 2: "🔴 The calculation wasn't quite right. Tip: check your working step by step. Common mistakes: wrong units, rounding too early, or using the wrong operation (multiply vs divide)."

For incorrect — Outcome 3: "🔴 This question needed you to explain your answer in words, not just give a number. Tip: always take a position (agree/disagree), show your working, and write one sentence explaining what your answer means."

OVERALL SUMMARY (use this template exactly):
"You got [X] out of [Y] right. [Strength]. The area to focus on is [weakest outcome]. [One specific practice tip]."

Return JSON in this exact format:
{
  "questions": [
    { "question_number": 1, "outcome": "outcome_1|outcome_2|outcome_3", "correct": true|false, "feedback": "..." },
    ...
  ],
  "overall": "summary string",
  "score": X,
  "total": Y,
  "weakest_outcome": "outcome_1|outcome_2|outcome_3"
}`
}

export function getPromptForStandard(standard: CaaStandard): string {
  switch (standard) {
    case 'US32405': return buildWritingFeedbackPrompt()
    case 'US32403': return buildReadingFeedbackPrompt()
    case 'US32406': return buildNumeracyFeedbackPrompt()
  }
}
