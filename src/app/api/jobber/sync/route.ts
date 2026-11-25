import { NextRequest, NextResponse } from "next/server";
import { syncVisit } from "@/lib/jobber";
import { sendVisitEmail } from "@/lib/email";
import { ensureClientLogin } from "@/lib/accounts";

// Manual re-sync of one visit: POST /api/jobber/sync  { "visitId": "<Jobber visit id>", "sendEmail": true }
// Header: Authorization: Bearer ADMIN_SECRET
export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.ADMIN_SECRET}`)
    return new NextResponse("Not allowed", { status: 403 });
  const { visitId, sendEmail } = await req.json();
  const r = await syncVisit(visitId);
  await ensureClientLogin(r.clientId);
  const email = sendEmail && r.completed ? await sendVisitEmail(r.visitId) : { sent: false };
  return NextResponse.json({ ...r, email });
}
