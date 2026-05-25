function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin === "https://www.passit.co.nz") {
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

const STANDARD_LABELS = {
  "32403": "Reading",
  "32405": "Writing",
  "32406": "Numeracy",
};

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "ANTHROPIC_API_KEY is not configured" });
  }

  const body = parseBody(req);
  if (!body) {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }

  const { weak_skills, standard, backfill } = body;

  if (!Array.isArray(weak_skills) || weak_skills.length === 0) {
    return res.status(400).json({ ok: false, error: "weak_skills must be a non-empty array" });
  }

  if (!standard || !STANDARD_LABELS[standard]) {
    return res.status(400).json({
      ok: false,
      error: "standard must be one of: 32403, 32405, 32406",
    });
  }

  const standardLabel = STANDARD_LABELS[standard];
  const skillsList = weak_skills.join(", ");

  const prompt = `Based on these weak skill areas identified during a practice session: ${skillsList}, generate feedback aligned to the NZQA CAA marking criteria. Be specific and actionable. Use plain English.

Standard: ${standardLabel}

Return a JSON object with:
{
  "criteria": [
    { "name": "criterion name", "met": true/false, "feedback": "specific actionable feedback" }
  ],
  "overall_feedback": "2-3 sentence summary",
  "score_pct": number (percentage of criteria met),
  "correct": number (criteria met count),
  "total": number (total criteria)
}

Return ONLY the JSON object, no other text.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ ok: false, error: `Anthropic API error: ${response.status} ${errText}` });
    }

    const data = await response.json();
    const text = (data.content && data.content[0] && data.content[0].text) || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ ok: false, error: "Could not parse JSON from AI response" });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ ok: true, result });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Internal server error" });
  }
};
