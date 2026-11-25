import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin";
import { visitEmailHtml } from "@/lib/email";
import { demoData } from "@/lib/demo-data";

// Renders the real visit email with sample data. Admin only.
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin", req.url));
  const v = demoData.visits.find((x) => x.status === "completed")!;
  const next = demoData.visits.find((x) => x.status === "scheduled");
  // Email clients can't show inline SVG data URIs reliably; the preview uses them only for illustration.
  const byRoom = new Map<string, { before?: string; after?: string }>();
  v.photos.forEach((p) => p.room && p.kind !== "other" && byRoom.set(p.room, { ...byRoom.get(p.room), [p.kind]: p.url }));
  const html = visitEmailHtml({
    firstName: demoData.client.contactName.split(" ")[0], title: v.title, site: v.site, startsAt: v.startsAt, clockIn: v.clockIn, clockOut: v.clockOut,
    team: v.team, tasks: v.tasks, teamNote: v.teamNote, nextVisit: next?.startsAt ?? null,
    pairs: [...byRoom].map(([room, x]) => ({ room, before: x.before!, after: x.after! })),
  });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
