import Link from "next/link";
import type { Visit } from "@/lib/types";
import { fmtDate, duration } from "@/lib/format";

export default function VisitRow({ v }: { v: Visit }) {
  const thumb = v.photos.find((p) => p.kind === "after") ?? v.photos[0];
  return (
    <Link className="visit" href={`/portal/visits/${v.id}`}>
      <div className="date"><b>{fmtDate(v.startsAt, { day: "numeric" })}</b><span>{fmtDate(v.startsAt, { month: "short" })}</span></div>
      <div style={{ minWidth: 0 }}>
        <h3>{v.title}</h3>
        <p>{[v.team, duration(v.clockIn, v.clockOut), v.photos.length ? `${v.photos.length} photos` : null].filter(Boolean).join(" · ")}</p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {thumb ? <img className="thumb" src={thumb.url} alt="" /> : <span />}
    </Link>
  );
}
