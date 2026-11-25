import "server-only";
import { cookies } from "next/headers";
import { demoMode, DEMO_COOKIE } from "./config";
import { demoData } from "./demo-data";
import { supabaseServer } from "./supabase/server";
import { supabaseAdmin } from "./supabase/admin";
import type { PortalData, Visit } from "./types";

/** Returns the signed-in client's data, or null when nobody is signed in. */
export async function getPortalData(): Promise<PortalData | null> {
  if (demoMode) {
    const store = await cookies();
    return store.get(DEMO_COOKIE)?.value === "1" ? demoData : null;
  }
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: member } = await sb.from("client_users").select("name, client_id, clients(*)").eq("auth_user_id", user.id).limit(1).maybeSingle();
  const c: any = member?.clients;
  if (!c) return { client: { name: user.email ?? "", contactName: user.email ?? "", email: user.email ?? "", phone: "", address: "", plan: "", accessNotes: "", preferences: "", clientSince: null }, visits: [], invoices: [] };

  // Visits and photos are read separately so a problem with photos can never hide the visit list.
  const [{ data: vs, error: ve }, { data: inv, error: ie }] = await Promise.all([
    sb.from("visits").select("*").eq("client_id", c.id).order("starts_at", { ascending: false }).limit(100),
    sb.from("invoices").select("*").eq("client_id", c.id).order("issued_at", { ascending: false }).limit(100),
  ]);
  if (ve) console.error("portal: visits query failed", ve);
  if (ie) console.error("portal: invoices query failed", ie);

  const visitIds = (vs ?? []).map((v: any) => v.id);
  const photosByVisit = new Map<string, any[]>();
  if (visitIds.length) {
    const { data: ph, error: pe } = await sb.from("visit_photos").select("*").in("visit_id", visitIds);
    if (pe) console.error("portal: photos query failed", pe);
    for (const p of ph ?? []) photosByVisit.set(p.visit_id, [...(photosByVisit.get(p.visit_id) ?? []), p]);
  }

  // Sign photo URLs (private bucket) for one hour. Rows above were already filtered by RLS,
  // so signing with the server key only exposes photos this client is allowed to see.
  const paths = [...photosByVisit.values()].flat().map((p) => p.storage_path);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data, error } = await supabaseAdmin().storage.from("visit-photos").createSignedUrls(paths, 3600);
    if (error) console.error("portal: signing photo URLs failed", error);
    data?.forEach((d) => d.path && d.signedUrl && signed.set(d.path, d.signedUrl));
  }

  const visits: Visit[] = (vs ?? []).map((v: any) => ({
    id: v.id, title: v.title ?? "Cleaning visit", site: v.site_name, siteAddress: v.site_address, status: v.status, startsAt: v.starts_at,
    clockIn: v.clock_in, clockOut: v.clock_out, team: v.team ?? "", tasks: Array.isArray(v.tasks) ? v.tasks : [], teamNote: v.team_note,
    photos: (photosByVisit.get(v.id) ?? []).filter((p: any) => signed.has(p.storage_path))
      .map((p: any) => ({ kind: p.kind, room: p.room, url: signed.get(p.storage_path)! })),
  }));

  return {
    client: { name: c.name, contactName: member?.name || c.contact_name || c.name, email: user.email ?? c.email ?? "", phone: c.phone ?? "", address: c.address ?? "", plan: c.plan ?? "",
      accessNotes: c.access_notes ?? "", preferences: c.preferences ?? "", clientSince: c.client_since },
    visits,
    invoices: (inv ?? []).map((i: any) => ({ id: i.id, number: i.number ?? "", subject: i.subject ?? "", issuedAt: i.issued_at,
      dueAt: i.due_at, total: Number(i.total), balance: Number(i.balance), status: i.status ?? "", paymentUrl: i.payment_url })),
  };
}
