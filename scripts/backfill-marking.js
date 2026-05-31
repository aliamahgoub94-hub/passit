/**
 * Backfill marking script for practice_sessions.
 *
 * Uses a pure lookup-table approach — no API calls, no Anthropic key needed.
 * Matches each row's weak_skills against known skill tags and generates
 * feedback_json locally.
 *
 * Usage:
 *   node scripts/backfill-marking.js
 *
 * Env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)
 */

const { createClient } = require("@supabase/supabase-js");
const {
  matchSkills,
  buildFeedbackJson,
} = require("../lib/caa-marking-lookup.js");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://soojtogwwakrkcvpudnu.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY if RLS allows UPDATE)"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Fetching practice_sessions where feedback_json IS NULL...");

  const { data: rows, error: fetchError } = await supabase
    .from("practice_sessions")
    .select("*")
    .is("feedback_json", null);

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
    const weakSkills = Array.isArray(row.weak_skills) ? row.weak_skills : [];

    if (weakSkills.length === 0) {
      console.log(`[${row.id}] Skipping — empty weak_skills`);
      skipped++;
      continue;
    }

    const matched = matchSkills(weakSkills, row.standard);
    const feedbackJson = buildFeedbackJson(matched, row.score_pct);

    if (matched.length === 0) {
      console.log(
        `[${row.id}] ${row.student_email || "(no email)"} / standard ${row.standard} → fallback feedback (skills: ${weakSkills.join(", ")})`
      );
    }

    const scorePct =
      matched.length > 0
        ? feedbackJson.score_pct
        : row.score_pct != null
          ? row.score_pct
          : feedbackJson.score_pct;

    const { error: updateError } = await supabase
      .from("practice_sessions")
      .update({
        feedback_json: feedbackJson,
        score_pct: scorePct,
        error_state: false,
      })
      .eq("id", row.id);

    if (updateError) {
      console.error(`[${row.id}] DB update failed: ${updateError.message}`);
      failed++;
    } else {
      console.log(
        `[${row.id}] ${row.student_email || "(no email)"} / standard ${row.standard} → ${matched.length} criteria, score ${scorePct}%`
      );
      succeeded++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total found:  ${rows.length}`);
  console.log(`Updated:      ${succeeded}`);
  console.log(`Skipped:      ${skipped}`);
  console.log(`Failed:       ${failed}`);
}

main();
