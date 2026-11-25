"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoMode, DEMO_COOKIE, DEMO_EMAIL, DEMO_PASSWORD, siteUrl } from "@/lib/config";
import { supabaseServer } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string };

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  if (demoMode) {
    if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) return { error: "That email and password don't match. Use the demo login shown below." };
    (await cookies()).set(DEMO_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
    redirect("/portal");
  }
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match. Try again or reset your password." };
  redirect("/portal");
}

export async function sendReset(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your email first, then press “Forgot password?”." };
  if (demoMode) return { message: "Demo mode: no email is sent." };
  const sb = await supabaseServer();
  await sb.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/auth/callback?next=/set-password` });
  return { message: "If that email has a portal account, we've sent a link to set a new password." };
}

export async function signOut() {
  if (demoMode) (await cookies()).delete(DEMO_COOKIE);
  else await (await supabaseServer()).auth.signOut();
  redirect("/login?signedout=1");
}
