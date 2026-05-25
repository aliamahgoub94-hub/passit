const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: "Stripe secret key is not configured" });
  }

  const sessionId = (req.query.session_id || "").toString().trim();
  if (!sessionId) {
    return res.status(400).json({ error: "session_id is required" });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return res.status(200).json({
      customer_email: session.customer_email || null
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to retrieve checkout session" });
  }
};
