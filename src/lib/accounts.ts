import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { siteUrl } from "./config";

/** Add a person who can sign in for a client, and email them an invite if they don't have a login yet. */
export async function ensureContact(clientId: string, email: string, name?: string | null) {
  const db = supabaseAdmin();
  const clean = email.trim().toLowerCase();
  const { data: row, error } = await db.from("client_users")
    .upsert({ client_id: clientId, email: clean, ...(name ? { name } : {}) }, { onConflict: "client_id,email" })
    .select().single();
  if (error) throw error;
  if (row.auth_user_id) return { status: "active" as const };

  const { data, error: inviteErr } = await db.auth.admin.inviteUserByEmail(clean, {
    redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
    data: { name: name ?? undefined },
  });
  let userId = data?.user?.id;
  if (inviteErr) {
    // Already has a login (e.g. contact for another client): link it.
    const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
    userId = list?.users.find((u) => u.email?.toLowerCase() === clean)?.id;
    if (!userId) { console.error("invite failed", inviteErr); return { status: "failed" as const }; }
  }
  await db.from("client_users").update({ auth_user_id: userId, invited_at: new Date().toISOString() }).eq("id", row.id);
  return { status: "invited" as const };
}

/** Invite the client's main contact from Jobber the first time we see them. */
export async function ensureClientLogin(clientId: string) {
  const { data: c } = await supabaseAdmin().from("clients").select("email, contact_name").eq("id", clientId).single();
  if (c?.email) await ensureContact(clientId, c.email, c.contact_name);
}
