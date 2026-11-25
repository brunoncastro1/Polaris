import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { authorizeUrl } from "@/lib/jobber";

// One-time setup: open /api/jobber/connect?key=ADMIN_SECRET and approve access in Jobber.
export async function GET(req: NextRequest) {
  if (!process.env.ADMIN_SECRET || req.nextUrl.searchParams.get("key") !== process.env.ADMIN_SECRET)
    return new NextResponse("Not allowed", { status: 403 });
  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set("jobber_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
