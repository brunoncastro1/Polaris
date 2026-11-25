import "server-only";
import { demoMode } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function teamMember() {
  if (demoMode) return null;
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (!user) return null;

  const db = supabaseAdmin();
  const { data, error } = await db.from("team_members").select("name").eq("user_id", user.id).maybeSingle();
  if (error && error.code !== "PGRST205" && error.code !== "42P01") console.error("Team membership lookup failed", error.code);
  return data ? { id: user.id, name: data.name as string, db } : null;
}
