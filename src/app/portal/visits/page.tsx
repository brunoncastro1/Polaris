import { getPortalData } from "@/lib/data";
import { fmtDate, fmtTime } from "@/lib/format";
import VisitRow from "@/components/VisitRow";

export default async function Visits() {
  const { visits } = (await getPortalData())!;
  const now = Date.now();
  const upcoming = visits.filter((v) => v.status === "scheduled" && +new Date(v.startsAt) > now).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const done = visits.filter((v) => v.status === "completed");
  return (
    <>
      <div className="sec-h"><h2>Visits &amp; photos</h2></div>
      {upcoming.map((v) => (
        <div key={v.id} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div><div className="k">Upcoming</div><b>{fmtDate(v.startsAt)} · {fmtTime(v.startsAt)}</b> {v.team && <span className="sub">with {v.team}</span>}</div>
          <span className="pill info">Scheduled</span>
        </div>
      ))}
      {done.length ? <div className="visits">{done.map((v) => <VisitRow key={v.id} v={v} />)}</div>
                   : <div className="panel empty">Your completed visits will be listed here.</div>}
    </>
  );
}
