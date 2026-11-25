import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/jobber";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state || state !== req.cookies.get("jobber_state")?.value)
    return new NextResponse("Invalid or expired request. Start again from /api/jobber/connect.", { status: 400 });
  try {
    await exchangeCode(code);
    return new NextResponse("Jobber is connected to the Polaris portal. You can close this tab.", { status: 200 });
  } catch (e) {
    console.error(e);
    return new NextResponse("Could not connect to Jobber. Check JOBBER_CLIENT_ID / JOBBER_CLIENT_SECRET and the redirect URL.", { status: 500 });
  }
}
