const {
  feedbackFromWeakSkills,
  normalizeWritingResult,
  matchSkills,
} = require("../../lib/caa-marking-lookup.js");
const { getAdminClient } = require("../../lib/supabase-admin.js");

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

async function markWritingWithAnthropic(apiKey, body) {
  const question = body.question || body.task || "";
  const rubric = Array.isArray(body.rubric)
    ? body.rubric.join(", ")
    : body.rubric || "";
  const responseText = body.response_text || "";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are an NCEA NZ writing assessor. Given a student's response and a rubric, return ONLY valid JSON in this exact format:
{"criteria":[{"name":"criterion name","verdict":"met"|"partial"|"missing","note":"one short sentence max"}],"overall":"One sentence overall feedback, specific and constructive."}
Be honest but encouraging. Use NZ English.`,
      messages: [
        {
          role: "user",
          content: `Task: ${question}\nRubric criteria: ${rubric}\nStudent response:\n${responseText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const text = (data.content && data.content[0] && data.content[0].text) || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse JSON from AI response");
  return normalizeWritingResult(JSON.parse(jsonMatch[0]));
}

async function updateSession(admin, sessionId, payload) {
  if (!sessionId || !admin) return;
  await admin.from("practice_sessions").update(payload).eq("id", sessionId);
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

  const {
    response_text,
    question,
    task,
    rubric,
    session_id,
    weak_skills,
    standard,
    backfill,
  } = body;

  const admin = getAdminClient();
  const isWriting =
    !backfill &&
    response_text &&
    String(response_text).trim() &&
    (standard === "32405" || standard === 32405);

  try {
    let result = null;

    if (isWriting) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ ok: false, error: "ANTHROPIC_API_KEY is not configured" });
      }
      result = await markWritingWithAnthropic(apiKey, {
        response_text,
        question: question || task,
        rubric,
      });
    } else if (Array.isArray(weak_skills) && standard) {
      const matched = matchSkills(weak_skills, standard);
      if (!matched.length && !backfill) {
        return res.status(400).json({
          ok: false,
          error: "No matching feedback for provided weak_skills",
        });
      }
      result = feedbackFromWeakSkills(
        standard,
        weak_skills,
        body.score_pct != null ? Number(body.score_pct) : null
      );
    } else {
      return res.status(400).json({
        ok: false,
        error:
          "Provide response_text for writing marking, or weak_skills + standard for lookup feedback",
      });
    }

    if (session_id && admin) {
      await updateSession(admin, session_id, {
        feedback_json: result,
        score_pct: result.score_pct,
        correct: result.correct,
        total: result.total,
        error_state: false,
      });
    }

    return res.status(200).json({ ok: true, result });
  } catch (err) {
    if (session_id && admin) {
      await updateSession(admin, session_id, { error_state: true }).catch(
        () => {}
      );
    }
    return res.status(500).json({
      ok: false,
      error: err.message || "Marking failed",
    });
  }
};
