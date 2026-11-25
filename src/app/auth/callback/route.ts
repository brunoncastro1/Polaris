import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Landing point for invite and password-reset links.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") || "/portal";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/portal";
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, req.url));
  }
  return NextResponse.redirect(new URL("/login", req.url));
}
