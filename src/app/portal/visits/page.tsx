import Link from "next/link";
import { getPortalData } from "@/lib/data";
import { fmtDate, fmtTime } from "@/lib/format";
import VisitRow from "@/components/VisitRow";

export default async function Visits({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site } = await searchParams;
  const { visits } = (await getPortalData())!;
  const sites = [...new Set(visits.map((v) => v.site).filter((s): s is string => Boolean(s)))].sort();
  const shown = site && sites.includes(site) ? visits.filter((v) => v.site === site) : visits;
  const now = Date.now();
  const upcoming = shown.filter((v) => v.status === "scheduled" && +new Date(v.startsAt) > now).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const done = shown.filter((v) => v.status === "completed");
  return (
    <>
      <div className="sec-h"><h2>Visits &amp; photos</h2>{sites.length > 1 && <span className="sub">{sites.length} buildings</span>}</div>
      {sites.length > 1 && (
        <nav className="rooms" aria-label="Filter by building" style={{ marginTop: 0 }}>
          <Link href="/portal/visits" className="chip" aria-current={!site ? "page" : undefined}>All buildings</Link>
          {sites.map((s) => <Link key={s} href={`/portal/visits?site=${encodeURIComponent(s)}`} className="chip" aria-current={site === s ? "page" : undefined}>{s}</Link>)}
        </nav>
      )}
      {upcoming.map((v) => (
        <div key={v.id} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}><div className="k">Upcoming</div><b>{fmtDate(v.startsAt)} · {fmtTime(v.startsAt)}</b>
            <div className="sub">{[v.site, v.title, v.team && `with ${v.team}`].filter(Boolean).join(" · ")}</div></div>
          <span className="pill info">Scheduled</span>
        </div>
      ))}
      {done.length ? <div className="visits">{done.map((v) => <VisitRow key={v.id} v={v} />)}</div>
                   : <div className="panel empty">Completed visits will be listed here.</div>}
    </>
  );
}
