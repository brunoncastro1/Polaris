import Link from "next/link";
import Logo from "@/components/Logo";
import { isAdmin } from "@/lib/admin";
import { demoMode } from "@/lib/config";
import { demoData } from "@/lib/demo-data";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fmtDate, money } from "@/lib/format";
import { adminLogout } from "./actions";
import { AdminLoginForm, InviteButton, AddContactForm, ResendEmailButton } from "./Forms";

export const metadata = { title: "Polaris Admin" };
export const dynamic = "force-dynamic";

type Contact = { id: string; name: string | null; email: string; hasLogin: boolean };
type Row = { id: string; name: string; contacts: Contact[]; sites: number; balance: number;
  lastVisit: { id: string; date: string; emailed: string | null } | null; nextVisit: string | null; visits: number };

async function loadRows(): Promise<{ rows: Row[]; jobberConnected: boolean }> {
  if (demoMode) {
    const d = demoData;
    const last = d.visits.find((v) => v.status === "completed")!;
    const next = d.visits.find((v) => v.status === "scheduled");
    return { jobberConnected: false, rows: [{ id: "demo", name: d.client.name,
      contacts: [{ id: "c1", name: d.client.contactName, email: d.client.email, hasLogin: true }, { id: "c2", name: "Dana Ortiz", email: "dana@lakeshore.example", hasLogin: false }],
      sites: new Set(d.visits.map((v) => v.site)).size,
      balance: d.invoices.reduce((a, i) => a + i.balance, 0), lastVisit: { id: last.id, date: last.startsAt, emailed: last.clockOut },
      nextVisit: next?.startsAt ?? null, visits: d.visits.filter((v) => v.status === "completed").length }] };
  }
  const db = supabaseAdmin();
  const [{ data: clients }, { data: contacts }, { data: visits }, { data: invoices }, { data: tok }] = await Promise.all([
    db.from("clients").select("id, name").order("name"),
    db.from("client_users").select("id, client_id, name, email, auth_user_id").order("created_at"),
    db.from("visits").select("id, client_id, status, starts_at, email_sent_at, site_name").order("starts_at", { ascending: false }),
    db.from("invoices").select("client_id, balance"),
    db.from("jobber_tokens").select("id").eq("id", 1).maybeSingle(),
  ]);
  const now = Date.now();
  const rows = (clients ?? []).map((c) => {
    const vs = (visits ?? []).filter((v) => v.client_id === c.id);
    const last = vs.find((v) => v.status === "completed");
    const next = vs.filter((v) => v.status === "scheduled" && +new Date(v.starts_at) > now).at(-1);
    return { id: c.id, name: c.name,
      contacts: (contacts ?? []).filter((u) => u.client_id === c.id).map((u) => ({ id: u.id, name: u.name, email: u.email, hasLogin: Boolean(u.auth_user_id) })),
      sites: new Set(vs.map((v) => v.site_name).filter(Boolean)).size,
      balance: (invoices ?? []).filter((i) => i.client_id === c.id).reduce((a, i) => a + Number(i.balance), 0),
      lastVisit: last ? { id: last.id, date: last.starts_at, emailed: last.email_sent_at } : null,
      nextVisit: next?.starts_at ?? null, visits: vs.filter((v) => v.status === "completed").length };
  });
  return { rows, jobberConnected: Boolean(tok) };
}

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <div className="auth"><div className="auth-card">
        <div className="auth-logo" style={{ background: "var(--navy)", margin: "-32px -28px 0", padding: "24px", borderRadius: "16px 16px 0 0" }}><Logo height={48} /></div>
        <div><h1 style={{ fontSize: 22 }}>Polaris admin</h1><p className="hint">For the Polaris team only.</p></div>
        <AdminLoginForm demo={demoMode} />
      </div></div>
    );
  }
  const { rows, jobberConnected } = await loadRows();
  const withLogin = rows.filter((r) => r.contacts.some((c) => c.hasLogin)).length;
  const owed = rows.reduce((a, r) => a + r.balance, 0);
  return (
    <>
      {demoMode && <div className="demo-bar">Demo mode · sample data</div>}
      <header className="top"><div className="wrap">
        <Logo />
        <div className="who"><span>Admin</span><form action={adminLogout}><button className="btn ghost">Log out</button></form></div>
      </div></header>
      <main className="wrap">
        <div className="sec-h"><h1 style={{ fontSize: 24 }}>Clients</h1>
          <span className={`pill ${jobberConnected ? "ok" : "warn"}`}>{jobberConnected ? "Jobber connected" : "Jobber not connected"}</span></div>
        <div className="grid3">
          <div className="panel"><div className="k">Clients</div><div className="v">{rows.length}</div></div>
          <div className="panel"><div className="k">With portal login</div><div className="v">{withLogin} / {rows.length}</div></div>
          <div className="panel"><div className="k">Open balance</div><div className="v">{money(owed)}</div></div>
        </div>
        {rows.length ? (
          <div className="panel tbl"><table className="admin">
            <thead><tr><th>Client</th><th>People with access</th><th>Last visit</th><th>Visit email</th><th>Next visit</th><th className="r">Balance</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td><b>{r.name}</b><div className="sub">{r.sites} {r.sites === 1 ? "building" : "buildings"}</div></td>
                <td style={{ whiteSpace: "normal", minWidth: 260 }}>
                  <div className="contacts">{r.contacts.map((c) => (
                    <div key={c.id} className="contact">
                      <div><b>{c.name || c.email}</b>{c.name && <div className="sub">{c.email}</div>}</div>
                      <span className={`pill ${c.hasLogin ? "ok" : "warn"}`}>{c.hasLogin ? "Active" : "Invited"}</span>
                      <InviteButton contactId={c.id} hasLogin={c.hasLogin} />
                    </div>))}
                    {!r.contacts.length && <span className="sub">No one yet</span>}
                  </div>
                  <AddContactForm clientId={r.id} />
                </td>
                <td>{r.lastVisit ? fmtDate(r.lastVisit.date) : "—"}<div className="sub">{r.visits} completed</div></td>
                <td>{r.lastVisit ? <>
                  <span className={`pill ${r.lastVisit.emailed ? "ok" : "warn"}`}>{r.lastVisit.emailed ? "Sent" : "Not sent"}</span>
                  <ResendEmailButton visitId={r.lastVisit.id} sent={Boolean(r.lastVisit.emailed)} /></> : "—"}</td>
                <td>{r.nextVisit ? fmtDate(r.nextVisit) : "—"}</td>
                <td className="r">{money(r.balance)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="panel empty">No clients yet. They appear here after the first visit syncs from Jobber.</div>}
        <div className="panel" style={{ display: "grid", gap: 8 }}>
          <h2 style={{ fontSize: 16 }}>Tools</h2>
          <p className="hint"><Link href="/admin/email-preview" target="_blank">Preview the visit email</Link> · see exactly what clients receive.</p>
          {!jobberConnected && !demoMode && <p className="hint">To connect Jobber, open <code>/api/jobber/connect?key=ADMIN_SECRET</code> while signed in to Jobber.</p>}
        </div>
      </main>
    </>
  );
}
