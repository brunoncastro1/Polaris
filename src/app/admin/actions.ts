"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, checkAdminPassword, isAdmin, setAdminSession } from "@/lib/admin";
import { demoMode } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureClientLogin } from "@/lib/accounts";
import { sendVisitEmail } from "@/lib/email";

export type AdminState = { error?: string; message?: string };

export async function adminLogin(_: AdminState, form: FormData): Promise<AdminState> {
  if (!checkAdminPassword(String(form.get("password") ?? ""))) return { error: "Wrong admin password." };
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}

export async function resendInvite(_: AdminState, form: FormData): Promise<AdminState> {
  if (!(await isAdmin())) return { error: "Sign in again." };
  if (demoMode) return { message: "Demo mode: invite not sent." };
  const id = String(form.get("clientId"));
  const db = supabaseAdmin();
  const { data: c } = await db.from("clients").select("email, auth_user_id").eq("id", id).single();
  if (!c?.email) return { error: "This client has no email in Jobber." };
  if (c.auth_user_id) {
    await db.auth.resetPasswordForEmail(c.email, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/set-password` });
    return { message: `Password link sent to ${c.email}.` };
  }
  await ensureClientLogin(id);
  revalidatePath("/admin");
  return { message: `Invite sent to ${c.email}.` };
}

export async function resendVisitEmail(_: AdminState, form: FormData): Promise<AdminState> {
  if (!(await isAdmin())) return { error: "Sign in again." };
  if (demoMode) return { message: "Demo mode: email not sent." };
  const id = String(form.get("visitId"));
  await supabaseAdmin().from("visits").update({ email_sent_at: null }).eq("id", id);
  try {
    const r = await sendVisitEmail(id);
    revalidatePath("/admin");
    return r.sent ? { message: "Visit email sent." } : { error: "Not sent: the visit isn't completed or the client has no email." };
  } catch (e) {
    return { error: String((e as Error).message) };
  }
}
