const Stripe = require("stripe");

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

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: "Stripe secret key is not configured" });
  }

  const body = parseBody(req);
  if (!body) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const sessionId = (body.sessionId || body.session_id || "").toString().trim();
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.status(200).json({
      email: session.customer_email || (session.customer_details && session.customer_details.email) || null
    });
  } catch (error) {
    const type = error && error.type;
    const statusCode = type === "StripeInvalidRequestError" ? 404 : 500;
    return res.status(statusCode).json({
      error: error.message || "Failed to retrieve checkout session"
    });
  }
};
