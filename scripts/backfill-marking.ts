/**
 * Backfill marking script for practice_sessions.
 *
 * Uses a pure lookup-table approach — no API calls, no Anthropic key needed.
 * Matches each row's weak_skills against known skill tags and generates
 * feedback_json locally.
 *
 * Usage:
 *   npx ts-node scripts/backfill-marking.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://soojtogwwakrkcvpudnu.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvb2p0b2d3d2FrcmtjdnB1ZG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTY2MjcsImV4cCI6MjA5MDY3MjYyN30.uAGLxv59vanJp9JSZ-wkT3mvKwVukrFQDRIvop8AWVs";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface LookupEntry {
  match: string[];
  criterion: string;
  feedback: string;
  score: number;
}

const LOOKUP_TABLE: Record<number, LookupEntry[]> = {
  // WRITING
  32405: [
    {
      match: [
        "customer communication",
        "business email",
        "workplace email",
        "formal language",
        "audience and purpose",
      ],
      criterion: "Your tone and word choices",
      feedback:
        "Your writing needs to sound more professional and formal throughout. Try swapping casual words for formal ones \u2014 get \u2192 obtain, tell \u2192 inform, need \u2192 require. Read it back and ask: would I say this at work?",
      score: 40,
    },
    {
      match: [
        "procedural instructions",
        "sequential instructions",
        "paragraph structure",
        "text structure",
      ],
      criterion: "How your writing flows",
      feedback:
        "Your ideas need to connect more logically. Use linking words \u2014 First, Then, Next, After that, Finally. Make sure each step follows naturally from the last and a reader could follow without asking questions.",
      score: 40,
    },
  ],

  // READING
  32403: [
    {
      match: [
        "locating specific information",
        "locating multiple pieces",
        "main idea",
      ],
      criterion: "Finding information in the text",
      feedback:
        "Go back to the text and find the exact sentence that answers the question before choosing your answer. Don\u2019t guess \u2014 the answer is always directly in the text.",
      score: 40,
    },
    {
      match: [
        "identifying bias",
        "comparing texts",
        "bias detection",
        "inference",
        "author purpose",
      ],
      criterion: "Reading between the lines",
      feedback:
        "These questions ask why the author wrote something, not just what they wrote. Ask yourself: what is the author trying to make me think or feel?",
      score: 40,
    },
  ],

  // NUMERACY
  32406: [
    {
      match: [
        "unit conversion",
        "measurement",
        "unit conversion cm\u00b3 to litres",
        "volume calculation",
      ],
      criterion: "Converting measurements",
      feedback:
        "Check your units carefully. Write down what you are converting from and to before you calculate. Common ones: cm to m \u00f7100, g to kg \u00f71000, mL to L \u00f71000.",
      score: 40,
    },
    {
      match: [
        "gst",
        "percentages",
        "gst calculations",
        "percentage calculations",
        "budgeting",
      ],
      criterion: "Percentages and money",
      feedback:
        "For GST: multiply by 1.15 to add GST, divide by 1.15 to remove it. For percentages: divide by 100 first, then multiply.",
      score: 40,
    },
    {
      match: [
        "speed",
        "rates",
        "time",
        "rate and reasonableness",
        "time calculations",
        "timetable reading",
      ],
      criterion: "Rates and measurement",
      feedback:
        "Use the formula triangle: Speed = Distance \u00f7 Time. Write the formula before you start and check your units match.",
      score: 40,
    },
    {
      match: ["probability scale", "statistics interpretation"],
      criterion: "Data and probability",
      feedback:
        "Read the question carefully \u2014 check if it asks for a fraction, decimal, or percentage. Count the total outcomes first, then the favourable ones.",
      score: 40,
    },
    {
      match: ["compass direction", "angle estimation"],
      criterion: "Direction and angles",
      feedback:
        "Remember: North is up, East is right. For angles, a right angle is 90\u00b0 \u2014 estimate by comparing to that.",
      score: 40,
    },
    {
      match: ["claim verification"],
      criterion: "Checking claims",
      feedback:
        "Do the calculation yourself before deciding if the claim is correct. Don\u2019t trust the rounded number \u2014 work it out exactly.",
      score: 40,
    },
  ],
};

function matchSkills(
  weakSkills: string[],
  standard: number
): { criterion: string; feedback: string; score: number }[] {
  const entries = LOOKUP_TABLE[standard];
  if (!entries) return [];

  const normalized = weakSkills.map((s) => s.toLowerCase().trim());
  const matched: { criterion: string; feedback: string; score: number }[] = [];

  for (const entry of entries) {
    const hit = entry.match.some((tag) =>
      normalized.some(
        (skill) => skill.includes(tag) || tag.includes(skill)
      )
    );
    if (hit) {
      matched.push({
        criterion: entry.criterion,
        feedback: entry.feedback,
        score: entry.score,
      });
    }
  }

  return matched;
}

function buildFeedbackJson(
  matched: { criterion: string; feedback: string; score: number }[]
) {
  const criteria = matched.map((m) => ({
    name: m.criterion,
    met: false,
    feedback: m.feedback,
  }));

  const criterionNames = matched.map((m) => m.criterion);
  const scorePct =
    matched.length > 0
      ? Math.round(
          matched.reduce((sum, m) => sum + m.score, 0) / matched.length
        )
      : 0;

  return {
    criteria,
    overall_feedback: `Based on your practice session, focus on: ${criterionNames.join(", ")}. Keep practising \u2014 each session builds your skills.`,
    score_pct: scorePct,
    correct: 0,
    total: matched.length,
  };
}

async function main() {
  console.log("Fetching practice_sessions with missing scores...");

  const { data: rows, error: fetchError } = await supabase
    .from("practice_sessions")
    .select("*")
    .or("score_pct.eq.0,score_pct.is.null")
    .not("weak_skills", "is", null)
    .not("weak_skills", "eq", "{}");

  if (fetchError) {
    console.error("Failed to fetch rows:", fetchError.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("No rows to backfill.");
    return;
  }

  console.log(`Found ${rows.length} row(s) to backfill.\n`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    const weakSkills: string[] = Array.isArray(row.weak_skills)
      ? row.weak_skills
      : [];

    if (weakSkills.length === 0) {
      console.log(`[${row.id}] Skipping \u2014 empty weak_skills`);
      skipped++;
      continue;
    }

    const matched = matchSkills(weakSkills, row.standard);

    if (matched.length === 0) {
      console.log(
        `[${row.id}] ${row.student_email} / standard ${row.standard} \u2192 no matching criteria (skills: ${weakSkills.join(", ")})`
      );
      skipped++;
      continue;
    }

    const feedbackJson = buildFeedbackJson(matched);

    const { error: updateError } = await supabase
      .from("practice_sessions")
      .update({
        feedback_json: feedbackJson,
        score_pct: feedbackJson.score_pct,
        error_state: false,
      })
      .eq("id", row.id);

    if (updateError) {
      console.error(`[${row.id}] DB update failed: ${updateError.message}`);
      failed++;
    } else {
      console.log(
        `[${row.id}] ${row.student_email} / standard ${row.standard} \u2192 ${matched.length} criteria, score ${feedbackJson.score_pct}%`
      );
      succeeded++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total found:  ${rows.length}`);
  console.log(`Processed:    ${succeeded}`);
  console.log(`Skipped:      ${skipped}`);
  console.log(`Failed:       ${failed}`);
}

main();
