import Link from "next/link";
import { getPortalData } from "@/lib/data";
import { fmtDate, fmtTime, duration, money } from "@/lib/format";
import BeforeAfter from "@/components/BeforeAfter";

export default async function Overview() {
  const { client, visits, invoices } = (await getPortalData())!;
  const now = Date.now();
  const next = visits.filter((v) => v.status === "scheduled" && +new Date(v.startsAt) > now).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0];
  const last = visits.find((v) => v.status === "completed");
  const due = invoices.reduce((a, i) => a + i.balance, 0);
  const firstDue = invoices.filter((i) => i.balance > 0 && i.dueAt).sort((a, b) => a.dueAt!.localeCompare(b.dueAt!))[0];

  return (
    <>
      <div className="greet"><h1>Hi, {client.name.split(" ")[0]}</h1><p className="sub">{client.address}</p></div>
      <div className="grid3">
        <div className="panel"><div className="k">Next visit</div>
          {next ? <><div className="v">{fmtDate(next.startsAt)}</div><div className="sub">{fmtTime(next.startsAt)}{next.team && ` · ${next.team}`}</div></>
                : <><div className="v">Not scheduled</div><div className="sub">We&apos;ll post it here once it&apos;s booked.</div></>}
        </div>
        <div className="panel"><div className="k">Balance due</div><div className="v">{money(due)}</div>
          <div className="sub">{due > 0 ? <span className="pill warn">{firstDue ? `Due ${fmtDate(firstDue.dueAt!, { month: "short", day: "numeric" })}` : "Open"}</span> : <span className="pill ok">All paid</span>}</div></div>
        <div className="panel"><div className="k">Your plan</div><div className="v" style={{ fontSize: 19 }}>{client.plan || "Commercial cleaning"}</div>
          {client.clientSince && <div className="sub">Client since {fmtDate(client.clientSince, { month: "long", year: "numeric" })}</div>}</div>
      </div>
      {last ? (
        <div className="panel" style={{ display: "grid", gap: 14 }}>
          <div className="sec-h"><h2>Last visit · {fmtDate(last.startsAt)}</h2><Link href={`/portal/visits/${last.id}`} style={{ fontWeight: 600 }}>Open visit →</Link></div>
          <div className="detail">
            <BeforeAfter photos={last.photos} />
            <div><span className="pill ok">Completed</span>
              <dl className="meta">
                {last.team && <><dt>Team</dt><dd>{last.team}</dd></>}
                <dt>Time on site</dt><dd>{fmtTime(last.clockIn)}–{fmtTime(last.clockOut)} ({duration(last.clockIn, last.clockOut)})</dd>
                <dt>Tasks done</dt><dd>{last.tasks.length}</dd>
              </dl>
              {last.teamNote && <div className="note"><b>Note from your team:</b> {last.teamNote}</div>}
            </div>
          </div>
        </div>
      ) : <div className="panel empty">After your first service visit, the photos and checklist will show up here.</div>}
    </>
  );
}
