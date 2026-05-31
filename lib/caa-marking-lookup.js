/** Shared weak-skill → NZQA feedback lookup (Writing / Reading / Numeracy). */

const LOOKUP_TABLE = {
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
        "Your writing needs to sound more professional and formal throughout. Try swapping casual words for formal ones — get → obtain, tell → inform, need → require. Read it back and ask: would I say this at work?",
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
        "Your ideas need to connect more logically. Use linking words — First, Then, Next, After that, Finally. Make sure each step follows naturally from the last and a reader could follow without asking questions.",
      score: 40,
    },
  ],
  32403: [
    {
      match: [
        "locating specific information",
        "locating multiple pieces",
        "main idea",
      ],
      criterion: "Finding information in the text",
      feedback:
        "Go back to the text and find the exact sentence that answers the question before choosing your answer. Don't guess — the answer is always directly in the text.",
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
  32406: [
    {
      match: [
        "unit conversion",
        "measurement",
        "unit conversion cm³ to litres",
        "volume calculation",
      ],
      criterion: "Converting measurements",
      feedback:
        "Check your units carefully. Write down what you are converting from and to before you calculate. Common ones: cm to m ÷100, g to kg ÷1000, mL to L ÷1000.",
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
        "Use the formula triangle: Speed = Distance ÷ Time. Write the formula before you start and check your units match.",
      score: 40,
    },
    {
      match: ["probability scale", "statistics interpretation"],
      criterion: "Data and probability",
      feedback:
        "Read the question carefully — check if it asks for a fraction, decimal, or percentage. Count the total outcomes first, then the favourable ones.",
      score: 40,
    },
    {
      match: ["compass direction", "angle estimation"],
      criterion: "Direction and angles",
      feedback:
        "Remember: North is up, East is right. For angles, a right angle is 90° — estimate by comparing to that.",
      score: 40,
    },
    {
      match: ["claim verification"],
      criterion: "Checking claims",
      feedback:
        "Do the calculation yourself before deciding if the claim is correct. Don't trust the rounded number — work it out exactly.",
      score: 40,
    },
  ],
};

function matchSkills(weakSkills, standard) {
  const stdNum =
    typeof standard === "string" ? parseInt(standard, 10) : standard;
  const entries = LOOKUP_TABLE[stdNum];
  if (!entries || !Array.isArray(weakSkills)) return [];

  const normalized = weakSkills.map((s) => String(s || "").toLowerCase().trim());
  const matched = [];
  const seen = new Set();

  for (const entry of entries) {
    if (seen.has(entry.criterion)) continue;
    const hit = entry.match.some((tag) =>
      normalized.some((skill) => skill.includes(tag) || tag.includes(skill))
    );
    if (hit) {
      seen.add(entry.criterion);
      matched.push({
        criterion: entry.criterion,
        feedback: entry.feedback,
        score: entry.score,
      });
    }
  }

  return matched;
}

function buildFeedbackJson(matched, examScorePct) {
  if (!matched.length) {
    return {
      criteria: [],
      overall_feedback:
        "Session completed. Keep practising — each session builds your skills.",
      overall:
        "Session completed. Keep practising — each session builds your skills.",
      score_pct: examScorePct != null ? examScorePct : 0,
      correct: 0,
      total: 0,
    };
  }

  const criteria = matched.map((m) => ({
    name: m.criterion,
    met: false,
    feedback: m.feedback,
  }));

  const criterionNames = matched.map((m) => m.criterion);
  const scorePct = Math.round(
    matched.reduce((sum, m) => sum + m.score, 0) / matched.length
  );

  const overall = `Based on your practice session, focus on: ${criterionNames.join(", ")}. Keep practising — each session builds your skills.`;

  return {
    criteria,
    overall_feedback: overall,
    overall,
    score_pct: scorePct,
    correct: 0,
    total: matched.length,
  };
}

function feedbackFromWeakSkills(standard, weakSkills, examScorePct) {
  const matched = matchSkills(weakSkills, standard);
  return buildFeedbackJson(matched, examScorePct);
}

function normalizeWritingResult(raw) {
  const list = Array.isArray(raw?.criteria) ? raw.criteria : [];
  const criteria = list.map((c) => {
    const verdict =
      c.verdict ||
      (c.met === true ? "met" : c.met === false ? "missing" : "partial");
    return {
      name: c.name || "Criterion",
      verdict,
      note: c.note || c.feedback || "",
      met: verdict === "met",
    };
  });

  const met = criteria.filter((c) => c.verdict === "met").length;
  const partial = criteria.filter((c) => c.verdict === "partial").length;
  const total = criteria.length || 1;
  const scorePct = Math.round(((met + partial * 0.5) / total) * 100);
  const overall = raw.overall || raw.overall_feedback || "";

  return {
    criteria,
    overall,
    overall_feedback: overall,
    score_pct: scorePct,
    correct: met,
    total,
  };
}

module.exports = {
  LOOKUP_TABLE,
  matchSkills,
  buildFeedbackJson,
  feedbackFromWeakSkills,
  normalizeWritingResult,
};
