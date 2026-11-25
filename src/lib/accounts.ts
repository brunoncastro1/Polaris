import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { siteUrl } from "./config";

/** Give a client a portal login: send a Supabase invite email the first time we see them. */
export async function ensureClientLogin(clientId: string) {
  const db = supabaseAdmin();
  const { data: c } = await db.from("clients").select("id, email, auth_user_id, name").eq("id", clientId).single();
  if (!c || c.auth_user_id || !c.email) return;
  const { data, error } = await db.auth.admin.inviteUserByEmail(c.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
    data: { name: c.name },
  });
  if (error) {
    // Already registered (e.g. invited earlier): link the existing user instead.
    const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
    const existing = list?.users.find((u) => u.email?.toLowerCase() === c.email!.toLowerCase());
    if (existing) await db.from("clients").update({ auth_user_id: existing.id }).eq("id", c.id);
    else console.error("invite failed", error);
    return;
  }
  await db.from("clients").update({ auth_user_id: data.user.id }).eq("id", c.id);
}
