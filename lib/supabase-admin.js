const { createClient } = require("@supabase/supabase-js");

function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://soojtogwwakrkcvpudnu.supabase.co";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "Missing Supabase key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)"
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveUserIdFromEmail(supabase, email) {
  if (!email) return null;
  const normalized = String(email).trim().toLowerCase();
  if (!normalized) return null;

  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) {
      console.error("resolveUserIdFromEmail:", error.message);
      return null;
    }
    const match = data.users.find(
      (u) => u.email && u.email.toLowerCase() === normalized
    );
    if (match) return match.id;
    if (data.users.length < 1000) break;
    page++;
  }
  return null;
}

module.exports = {
  getSupabaseAdmin,
  getAdminClient: getSupabaseAdmin,
  resolveUserIdFromEmail,
  resolveUserIdByEmail: resolveUserIdFromEmail,
};
