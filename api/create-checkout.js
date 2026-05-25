// PAYMENTS PAUSED — re-enable after exam season
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

  const emailInput = (body.customer_email || body.email || "").toString().trim();
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput);
  if (!emailIsValid) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "nzd",
            unit_amount: 2999,
            product_data: { name: "Passit Full Access" }
          },
          quantity: 1
        }
      ],
      success_url: "https://www.passit.co.nz/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://www.passit.co.nz/pricing.html",
      customer_email: emailInput,
      client_reference_id: emailInput
    });

    if (!session.url) {
      return res.status(500).json({ error: "Stripe checkout URL was not created" });
    }

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
};
