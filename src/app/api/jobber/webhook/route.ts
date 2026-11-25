import { NextRequest, NextResponse } from "next/server";
import { syncVisit, verifyWebhook } from "@/lib/jobber";
import { sendVisitEmail } from "@/lib/email";
import { ensureClientLogin } from "@/lib/accounts";

export const maxDuration = 60;

// Subscribe your Jobber app to VISIT_COMPLETE, VISIT_CREATE and VISIT_UPDATE pointing here.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-jobber-hmac-sha256"))) return new NextResponse("Bad signature", { status: 401 });

  const event = JSON.parse(raw)?.data?.webHookEvent;
  const topic: string = event?.topic ?? "";
  const itemId: string | undefined = event?.itemId;
  if (!itemId || !topic.startsWith("VISIT_")) return NextResponse.json({ ignored: true });

  try {
    const r = await syncVisit(itemId);
    await ensureClientLogin(r.clientId);
    if (r.completed && !r.alreadyEmailed) await sendVisitEmail(r.visitId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("webhook failed", topic, itemId, e);
    return NextResponse.json({ ok: false }, { status: 500 }); // Jobber retries on failure
  }
}
