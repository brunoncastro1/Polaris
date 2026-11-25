import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalData } from "@/lib/data";
import { fmtDate, fmtTime, duration } from "@/lib/format";
import BeforeAfter from "@/components/BeforeAfter";

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = (await getPortalData())!.visits.find((x) => x.id === id);
  if (!v) notFound();
  return (
    <>
      <Link href="/portal/visits" style={{ fontWeight: 600 }}>← All visits</Link>
      <div className="sec-h"><div><h1 style={{ fontSize: 24 }}>{fmtDate(v.startsAt, { weekday: "long", month: "long", day: "numeric" })}</h1><p className="sub">{v.title}</p></div>
        <span className={`pill ${v.status === "completed" ? "ok" : "info"}`}>{v.status === "completed" ? "Completed" : "Scheduled"}</span></div>
      <div className="detail">
        <BeforeAfter photos={v.photos} />
        <div className="panel"><h2 style={{ fontSize: 16 }}>Visit details</h2>
          <dl className="meta">
            {v.team && <><dt>Team</dt><dd>{v.team}</dd></>}
            <dt>Arrived</dt><dd>{fmtTime(v.clockIn)}</dd>
            <dt>Finished</dt><dd>{fmtTime(v.clockOut)}</dd>
            <dt>Time on site</dt><dd>{duration(v.clockIn, v.clockOut)}</dd>
          </dl>
          {v.teamNote && <div className="note"><b>Note from your team:</b> {v.teamNote}</div>}
        </div>
      </div>
      {v.tasks.length > 0 && <div className="panel"><h2 style={{ fontSize: 16 }}>What we did</h2><ul className="checklist">{v.tasks.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
    </>
  );
}
