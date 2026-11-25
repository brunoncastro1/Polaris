"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function setPassword(_: { error?: string }, form: FormData) {
  const pw = String(form.get("password") ?? "");
  if (pw.length < 8) return { error: "Use at least 8 characters." };
  if (pw !== String(form.get("confirm") ?? "")) return { error: "The two passwords don't match." };
  const { error } = await (await supabaseServer()).auth.updateUser({ password: pw });
  if (error) return { error: "Couldn't save your password. Open the link from your email again." };
  redirect("/portal");
}
