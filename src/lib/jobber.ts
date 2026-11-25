import "server-only";
import crypto from "node:crypto";
import { supabaseAdmin } from "./supabase/admin";
import { siteUrl } from "./config";

/*
 * Jobber integration.
 * Docs: https://developer.getjobber.com  (GraphQL API + OAuth 2 + webhooks)
 *
 * IMPORTANT: Jobber's GraphQL schema changes between API versions. The query in
 * VISIT_QUERY was written from Jobber's public docs and must be checked once in
 * the GraphiQL explorer of your Jobber developer app. Every field is read
 * defensively, so a missing field leaves that part empty instead of crashing.
 */

const API = "https://api.getjobber.com/api/graphql";
const OAUTH = "https://api.getjobber.com/api/oauth";

export const redirectUri = () => `${siteUrl}/api/jobber/callback`;

export function authorizeUrl(state: string) {
  const p = new URLSearchParams({ response_type: "code", client_id: process.env.JOBBER_CLIENT_ID!, redirect_uri: redirectUri(), state });
  return `${OAUTH}/authorize?${p}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(`${OAUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.JOBBER_CLIENT_ID!, client_secret: process.env.JOBBER_CLIENT_SECRET!, ...body }),
  });
  if (!res.ok) throw new Error(`Jobber token request failed: ${res.status} ${await res.text()}`);
  const j = await res.json();
  const expiresAt = new Date(Date.now() + ((j.expires_in ?? 3600) - 120) * 1000).toISOString();
  await supabaseAdmin().from("jobber_tokens").upsert({ id: 1, access_token: j.access_token, refresh_token: j.refresh_token, expires_at: expiresAt });
  return j.access_token as string;
}

export const exchangeCode = (code: string) => tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri() });

async function accessToken() {
  const { data } = await supabaseAdmin().from("jobber_tokens").select("*").eq("id", 1).maybeSingle();
  if (!data) throw new Error("Jobber is not connected yet. Open /api/jobber/connect first.");
  if (new Date(data.expires_at) > new Date()) return data.access_token as string;
  return tokenRequest({ grant_type: "refresh_token", refresh_token: data.refresh_token });
}

export async function gql<T = any>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      "X-JOBBER-GRAPHQL-VERSION": process.env.JOBBER_API_VERSION || "2025-01-20",
    },
    body: JSON.stringify({ query, variables }),
  });
  const j = await res.json();
  if (j.errors?.length) throw new Error("Jobber GraphQL: " + JSON.stringify(j.errors));
  return j.data;
}

/** Webhooks are signed with HMAC-SHA256 (base64) of the raw body using the app's client secret. */
export function verifyWebhook(rawBody: string, signature: string | null) {
  if (!signature || !process.env.JOBBER_CLIENT_SECRET) return false;
  const expected = crypto.createHmac("sha256", process.env.JOBBER_CLIENT_SECRET!).update(rawBody).digest("base64");
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const VISIT_QUERY = /* GraphQL */ `
query PortalVisit($id: EncodedId!) {
  visit(id: $id) {
    id
    title
    startAt
    endAt
    completedAt
    instructions
    assignedUsers { nodes { name { full first } } }
    lineItems { nodes { name description } }
    client {
      id
      name
      firstName
      emails { address primary }
      phones { number primary }
    }
    property { address { street city province postalCode } }
    job {
      id
      title
      notes(first: 50) {
        nodes {
          ... on JobNote {
            message
            createdAt
            fileAttachments { nodes { id fileName url contentType } }
          }
        }
      }
    }
  }
}`;

const INVOICES_QUERY = /* GraphQL */ `
query PortalInvoices($clientId: EncodedId!) {
  client(id: $clientId) {
    invoices(first: 50) {
      nodes {
        id
        invoiceNumber
        subject
        issuedDate
        dueDate
        invoiceStatus
        amounts { total invoiceBalance }
        clientHubUri
      }
    }
  }
}`;

/** Photo naming convention used by the team (see README): note text or file name contains
 *  "before" or "after", optionally followed by the room, e.g. "Before - Kitchen". */
function classify(text: string): { kind: "before" | "after" | "other"; room: string | null } {
  const t = text.toLowerCase();
  const kind = t.includes("before") ? "before" : t.includes("after") ? "after" : "other";
  const m = text.match(/(?:before|after)\s*[-:–]?\s*([a-z][a-z ]{1,30})/i);
  const room = m ? m[1].replace(/\.(jpe?g|png|heic|webp)$/i, "").trim().replace(/\b\w/g, (c) => c.toUpperCase()) : null;
  return { kind, room };
}

/** Pull one visit from Jobber into Supabase. Returns the portal visit id and whether it is completed. */
export async function syncVisit(jobberVisitId: string) {
  const db = supabaseAdmin();
  const { visit: v } = await gql<{ visit: any }>(VISIT_QUERY, { id: jobberVisitId });
  if (!v) throw new Error(`Visit ${jobberVisitId} not found in Jobber`);

  const c = v.client ?? {};
  const email = (c.emails ?? []).find((e: any) => e.primary)?.address ?? c.emails?.[0]?.address ?? null;
  const phone = (c.phones ?? []).find((p: any) => p.primary)?.number ?? c.phones?.[0]?.number ?? null;
  const a = v.property?.address;
  const address = a ? [a.street, a.city, [a.province, a.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ") : null;

  const { data: client, error: ce } = await db.from("clients")
    .upsert({ jobber_client_id: c.id, name: c.name ?? "Client", email, phone, address }, { onConflict: "jobber_client_id" })
    .select().single();
  if (ce) throw ce;

  const notes: any[] = v.job?.notes?.nodes ?? [];
  const textNotes = notes.map((n) => (n.message ?? "").trim()).filter((m) => m && !/^(before|after)\b/i.test(m));
  const tasks: string[] = (v.lineItems?.nodes ?? []).map((li: any) => [li.name, li.description].filter(Boolean).join(": ")).filter(Boolean);
  const team = (v.assignedUsers?.nodes ?? []).map((u: any) => u.name?.first ?? u.name?.full).filter(Boolean).join(" & ");
  const completed = Boolean(v.completedAt);

  const { data: visit, error: ve } = await db.from("visits").upsert({
    jobber_visit_id: v.id,
    client_id: client.id,
    title: v.title ?? v.job?.title ?? "Cleaning visit",
    status: completed ? "completed" : "scheduled",
    starts_at: v.startAt,
    clock_in: v.startAt,               // replaced by timesheet times below when available
    clock_out: v.completedAt ?? v.endAt,
    team,
    tasks,
    team_note: textNotes.at(-1) ?? v.instructions ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "jobber_visit_id" }).select().single();
  if (ve) throw ve;

  // Copy photos into private storage (Jobber file URLs expire).
  for (const n of notes) {
    for (const f of n.fileAttachments?.nodes ?? []) {
      if (!String(f.contentType ?? "").startsWith("image/")) continue;
      const { data: exists } = await db.from("visit_photos").select("id").eq("jobber_file_id", f.id).maybeSingle();
      if (exists) continue;
      const img = await fetch(f.url);
      if (!img.ok) continue;
      const path = `${client.id}/${visit.id}/${f.id}-${String(f.fileName ?? "photo").replace(/[^\w.-]/g, "_")}`;
      await db.storage.from("visit-photos").upload(path, await img.arrayBuffer(), { contentType: f.contentType, upsert: true });
      const { kind, room } = classify(`${n.message ?? ""} ${f.fileName ?? ""}`);
      await db.from("visit_photos").insert({ visit_id: visit.id, kind, room, storage_path: path, jobber_file_id: f.id });
    }
  }

  await syncInvoices(c.id, client.id).catch((e) => console.error("invoice sync failed", e));
  return { visitId: visit.id as string, clientId: client.id as string, completed, alreadyEmailed: Boolean(visit.email_sent_at) };
}

export async function syncInvoices(jobberClientId: string, clientId: string) {
  const data = await gql<{ client: any }>(INVOICES_QUERY, { clientId: jobberClientId });
  const rows = (data.client?.invoices?.nodes ?? []).map((i: any) => ({
    jobber_invoice_id: i.id, client_id: clientId, number: i.invoiceNumber, subject: i.subject,
    issued_at: i.issuedDate, due_at: i.dueDate, total: i.amounts?.total ?? 0, balance: i.amounts?.invoiceBalance ?? 0,
    status: String(i.invoiceStatus ?? "").toLowerCase(), payment_url: i.clientHubUri ?? null,
  }));
  if (rows.length) await supabaseAdmin().from("invoices").upsert(rows, { onConflict: "jobber_invoice_id" });
}
