import "server-only";
import { Resend } from "resend";
import { supabaseAdmin } from "./supabase/admin";
import { brand, siteUrl } from "./config";
import { fmtDate, fmtTime, duration } from "./format";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export type EmailVisit = {
  firstName: string; title: string; startsAt: string; clockIn: string | null; clockOut: string | null;
  team: string; tasks: string[]; teamNote: string | null; pairs: { room: string; before: string; after: string }[];
  nextVisit: string | null;
};

/** Table-based HTML so it renders in Gmail, Outlook and Apple Mail. */
export function visitEmailHtml(v: EmailVisit) {
  const navy = "#0a1520", accent = "#074b7b", star = "#d9a531";
  const shown = v.tasks.slice(0, 6), more = v.tasks.length - shown.length;
  const pairs = v.pairs.slice(0, 3).map((p) => `
    <tr><td style="padding:0 0 4px;font:600 13px Arial,sans-serif;color:#5d6f7b">${esc(p.room)}</td></tr>
    <tr><td style="padding:0 0 14px"><table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="50%" style="padding-right:3px"><img src="${p.before}" width="270" alt="${esc(p.room)} before" style="display:block;width:100%;border-radius:6px"><div style="font:700 10px Arial;color:#5d6f7b;padding-top:3px;letter-spacing:1px">BEFORE</div></td>
      <td width="50%" style="padding-left:3px"><img src="${p.after}" width="270" alt="${esc(p.room)} after" style="display:block;width:100%;border-radius:6px"><div style="font:700 10px Arial;color:#5d6f7b;padding-top:3px;letter-spacing:1px">AFTER</div></td>
    </tr></table></td></tr>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#eef2f6">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6"><tr><td align="center" style="padding:24px 12px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden">
  <tr><td style="background:${navy};padding:20px 24px"><img src="${siteUrl}/logo-white.png" alt="${esc(brand.name)}" height="44" style="display:block;height:44px;width:auto;border:0"></td></tr>
  <tr><td style="padding:28px 24px 8px;font:700 22px Arial,sans-serif;color:#14232e">Hi ${esc(v.firstName)}, your facility is all set</td></tr>
  <tr><td style="padding:0 24px 18px;font:15px/1.6 Arial,sans-serif;color:#33434e">${esc(v.team || "Our team")} completed your ${esc(v.title.toLowerCase())} on ${esc(fmtDate(v.startsAt, { weekday: "long", month: "long", day: "numeric" }))}. Here's what we did.</td></tr>
  <tr><td style="padding:0 24px 22px"><table width="100%" cellpadding="12" cellspacing="0" style="background:#e8eef6;border-radius:8px;font:13px Arial,sans-serif;color:#5d6f7b"><tr>
    <td>ARRIVED<br><b style="font-size:15px;color:#14232e">${fmtTime(v.clockIn)}</b></td>
    <td>FINISHED<br><b style="font-size:15px;color:#14232e">${fmtTime(v.clockOut)}</b></td>
    <td>TIME ON SITE<br><b style="font-size:15px;color:#14232e">${duration(v.clockIn, v.clockOut)}</b></td></tr></table></td></tr>
  ${pairs ? `<tr><td style="padding:0 24px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 0 10px;font:700 16px Arial,sans-serif;color:#14232e">Before &amp; after</td></tr>${pairs}</table></td></tr>` : ""}
  ${shown.length ? `<tr><td style="padding:6px 24px 0;font:700 16px Arial,sans-serif;color:#14232e">What we did</td></tr>
  <tr><td style="padding:8px 24px 0;font:14px/1.7 Arial,sans-serif;color:#33434e">${shown.map((t) => `<span style="color:#1f8a4c;font-weight:700">&#10003;</span>&nbsp; ${esc(t)}`).join("<br>")}${more > 0 ? `<br><span style="color:#5d6f7b">+ ${more} more in your portal</span>` : ""}</td></tr>` : ""}
  ${v.teamNote ? `<tr><td style="padding:18px 24px 0"><div style="background:#fdf6e3;border-left:3px solid ${star};padding:12px 14px;font:14px/1.55 Arial,sans-serif;color:#33434e"><b>Note from your team:</b> ${esc(v.teamNote)}</div></td></tr>` : ""}
  <tr><td style="padding:24px"><a href="${siteUrl}/portal" style="display:block;background:${accent};color:#fff;text-align:center;font:700 15px Arial,sans-serif;padding:14px;border-radius:8px;text-decoration:none">View full report in your portal</a></td></tr>
  ${v.nextVisit ? `<tr><td style="padding:0 24px 24px;font:14px Arial,sans-serif;color:#5d6f7b">Next visit: <b style="color:#14232e">${esc(fmtDate(v.nextVisit))} at ${fmtTime(v.nextVisit)}</b></td></tr>` : ""}
  <tr><td style="background:#f3f6f8;padding:16px 24px;font:12px/1.6 Arial,sans-serif;color:#7a8a95;text-align:center">${esc(brand.name)}${brand.phone ? " · " + esc(brand.phone) : ""}<br>You're receiving this because you're a ${esc(brand.name)} client.</td></tr>
</table></td></tr></table></body></html>`;
}

/** Build and send the visit summary for a completed visit, once. */
export async function sendVisitEmail(visitId: string) {
  const db = supabaseAdmin();
  const { data: v } = await db.from("visits").select("*, clients(*), visit_photos(*)").eq("id", visitId).single();
  if (!v || v.email_sent_at || v.status !== "completed" || !v.clients?.email) return { sent: false };

  // Signed links valid 30 days so the email images keep working.
  const byRoom = new Map<string, { before?: string; after?: string }>();
  for (const p of v.visit_photos ?? []) {
    if (p.kind === "other") continue;
    const { data } = await db.storage.from("visit-photos").createSignedUrl(p.storage_path, 60 * 60 * 24 * 30);
    if (!data) continue;
    const key = p.room || "Your facility";
    byRoom.set(key, { ...byRoom.get(key), [p.kind]: data.signedUrl });
  }
  const pairs = [...byRoom].filter(([, x]) => x.before && x.after).map(([room, x]) => ({ room, before: x.before!, after: x.after! }));

  const { data: next } = await db.from("visits").select("starts_at").eq("client_id", v.client_id).eq("status", "scheduled")
    .gt("starts_at", new Date().toISOString()).order("starts_at").limit(1).maybeSingle();

  const html = visitEmailHtml({
    firstName: String(v.clients.name).split(" ")[0], title: v.title ?? "cleaning visit", startsAt: v.starts_at,
    clockIn: v.clock_in, clockOut: v.clock_out, team: v.team ?? "", tasks: v.tasks ?? [], teamNote: v.team_note,
    pairs, nextVisit: next?.starts_at ?? null,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!, to: v.clients.email,
    subject: `Service completed: ${fmtDate(v.starts_at)} visit summary`, html,
  });
  if (error) throw new Error("Email failed: " + JSON.stringify(error));
  await db.from("visits").update({ email_sent_at: new Date().toISOString() }).eq("id", visitId);
  return { sent: true };
}
