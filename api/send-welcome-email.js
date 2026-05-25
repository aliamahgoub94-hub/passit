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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildHtmlContent() {
  return "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body style=\"margin:0;padding:0;background:#f6f7fb;font-family:Arial,sans-serif;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f6f7fb;padding:20px 12px;\"><tr><td align=\"center\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;\"><tr><td style=\"padding:28px 24px 8px;text-align:left;\"><div style=\"font-size:28px;line-height:1;color:#0f1f47;font-weight:700;\">passit</div></td></tr><tr><td style=\"padding:8px 24px 0;text-align:left;\"><h1 style=\"margin:0;color:#0f1f47;font-size:28px;line-height:1.25;\">Welcome to Passit Full Access</h1><p style=\"margin:12px 0 0;color:#374151;font-size:16px;line-height:1.6;\">You're all set. Here's everything you need to get started.</p></td></tr><tr><td style=\"padding:20px 24px 0;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border:2px solid #f97316;border-radius:10px;\"><tr><td style=\"padding:18px;text-align:center;\"><div style=\"color:#9a3412;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;\">YOUR ACCESS CODE</div><div style=\"margin-top:8px;color:#0f1f47;font-family:'Courier New',Courier,monospace;font-size:34px;line-height:1.2;font-weight:700;letter-spacing:.06em;\">PASSIT2026</div></td></tr></table></td></tr><tr><td style=\"padding:20px 24px 0;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td width=\"50%\" style=\"padding-right:6px;\"><a href=\"https://www.passit.co.nz/simulator-pro.html\" style=\"display:block;text-align:center;background:#0f1f47;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;line-height:44px;border-radius:8px;\">Open Simulator</a></td><td width=\"50%\" style=\"padding-left:6px;\"><a href=\"https://www.passit.co.nz/parent-dashboard.html\" style=\"display:block;text-align:center;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;line-height:44px;border-radius:8px;\">View Parent Dashboard</a></td></tr></table></td></tr><tr><td style=\"padding:20px 24px 0;\"><hr style=\"border:0;border-top:1px solid #e5e7eb;margin:0;\"></td></tr><tr><td style=\"padding:16px 24px 28px;\"><p style=\"margin:0;color:#4b5563;font-size:13px;line-height:1.6;\">Child uses simulator, parent uses dashboard.</p><p style=\"margin:12px 0 0;color:#6b7280;font-size:12px;line-height:1.6;\">Questions? hello@passit.co.nz &middot; passit.co.nz &middot; &copy; 2026 Passit</p></td></tr></table></td></tr></table></body></html>";
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "BREVO_API_KEY is not configured" });
  }

  const body = parseBody(req);
  if (!body) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const email = (body.email || body.customer_email || "").toString().trim().toLowerCase();
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  try {
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        sender: { name: "Passit", email: "hello@passit.co.nz" },
        to: [{ email: email }],
        subject: "Your Passit Full Access is ready",
        htmlContent: buildHtmlContent()
      })
    });

    const raw = await brevoResponse.text();
    let payload = null;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch (_err) {
      payload = { raw };
    }

    if (!brevoResponse.ok) {
      return res.status(brevoResponse.status).json({
        ok: false,
        error: "Failed to send welcome email",
        brevo: payload
      });
    }

    return res.status(200).json({ ok: true, brevo: payload });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to send welcome email"
    });
  }
};
