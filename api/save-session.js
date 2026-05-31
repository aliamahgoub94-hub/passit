const {
  feedbackFromWeakSkills,
  normalizeWritingResult,
  matchSkills,
} = require("../lib/caa-marking-lookup.js");
const {
  getSupabaseAdmin,
  resolveUserIdFromEmail,
} = require("../lib/supabase-admin.js");

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (
    origin === "https://www.passit.co.nz" ||
    origin === "https://passit.co.nz" ||
    origin === "http://localhost:3000" ||
    origin === "http://127.0.0.1:3000"
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_err) {
      return null;
    }
  }
  return req.body;
}

function isValidWritingFeedback(fb) {
  return fb && typeof fb === "object" && Array.isArray(fb.criteria) && fb.criteria.length > 0;
}

async function markWritingOnServer(task, rubric, responseText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const rubricList = Array.isArray(rubric) ? rubric.join(", ") : rubric || "";
  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: `You are an NCEA NZ writing assessor. Given a student's response and a rubric, return ONLY valid JSON in this exact format:
{"criteria":[{"name":"criterion name","verdict":"met"|"partial"|"missing","note":"one short sentence max"}],"overall":"One sentence overall feedback, specific and constructive."}
Be honest but encouraging. Use NZ English.`,
      messages: [
        {
          role: "user",
          content: `Task: ${task || ""}\nRubric criteria: ${rubricList}\nStudent response:\n${responseText}`,
        },
      ],
    }),
  });

  if (!aiRes.ok) return null;

  const data = await aiRes.json();
  const text = (data.content && data.content[0] && data.content[0].text) || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  return normalizeWritingResult(JSON.parse(jsonMatch[0]));
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = parseBody(req);
  if (!body) {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }

  const std = Number(body.standard);
  if (!std || ![32403, 32405, 32406].includes(std)) {
    return res.status(400).json({
      ok: false,
      error: "standard must be one of: 32403, 32405, 32406",
    });
  }

  const studentEmail = String(body.student_email || "").trim();
  if (!studentEmail || !studentEmail.includes("@")) {
    return res.status(400).json({ ok: false, error: "Valid student_email required" });
  }

  const weakSkills = Array.isArray(body.weak_skills) ? body.weak_skills : [];
  const examScorePct = body.score_pct != null ? Number(body.score_pct) : null;
  let feedbackJson = null;
  let errorState = false;
  let finalScorePct = examScorePct;

  if (std === 32405) {
    if (isValidWritingFeedback(body.feedback_json)) {
      feedbackJson = normalizeWritingResult(body.feedback_json);
      errorState = false;
    } else if (body.response_text && String(body.response_text).trim()) {
      try {
        feedbackJson = await markWritingOnServer(
          body.writing_task,
          body.writing_rubric,
          body.response_text
        );
      } catch (_err) {
        feedbackJson = null;
      }
    }

    if (!isValidWritingFeedback(feedbackJson)) {
      feedbackJson = feedbackFromWeakSkills(std, weakSkills, examScorePct);
      errorState = true;
    } else {
      finalScorePct = feedbackJson.score_pct;
      errorState = false;
    }
  } else {
    feedbackJson = feedbackFromWeakSkills(std, weakSkills, examScorePct);
    const matched = matchSkills(weakSkills, std);
    errorState = matched.length === 0 && weakSkills.length > 0;
    finalScorePct = examScorePct;
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }

  let userId = body.user_id || null;
  if (!userId) {
    try {
      userId = await resolveUserIdFromEmail(admin, studentEmail);
    } catch (err) {
      console.error("resolveUserIdFromEmail failed:", err.message);
    }
  }

  const row = {
    student_email: studentEmail,
    user_id: userId,
    standard: std,
    score_pct: finalScorePct,
    correct: body.correct ?? null,
    total: body.total ?? null,
    time_seconds: body.time_seconds ?? null,
    weak_skills: weakSkills,
    response_text: body.response_text ?? null,
    feedback_json: feedbackJson,
    error_state: errorState,
    session_date: body.session_date || new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("practice_sessions")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({
    ok: true,
    id: data.id,
    user_id: userId,
    feedback_json: feedbackJson,
    score_pct: finalScorePct,
    error_state: errorState,
  });
};
