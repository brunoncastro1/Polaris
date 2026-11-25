"use client";
import { useMemo, useState } from "react";
import type { Photo } from "@/lib/types";

export default function BeforeAfter({ photos }: { photos: Photo[] }) {
  const pairs = useMemo(() => {
    const m = new Map<string, { before?: string; after?: string }>();
    for (const p of photos) {
      if (p.kind === "other") continue;
      const k = p.room || "Your home";
      m.set(k, { ...m.get(k), [p.kind]: p.url });
    }
    return [...m].filter(([, x]) => x.before && x.after).map(([room, x]) => ({ room, before: x.before!, after: x.after! }));
  }, [photos]);
  const others = photos.filter((p) => p.kind === "other" || !pairs.some((x) => x.room === (p.room || "Your home")));
  const [i, setI] = useState(0);
  const [cut, setCut] = useState(50);

  if (!pairs.length && !others.length) return <div className="panel empty">Photos from this visit will appear here.</div>;
  const p = pairs[Math.min(i, pairs.length - 1)];

  return (
    <div style={{ minWidth: 0, display: "grid", gap: 12 }}>
      {p && (
        <div>
          <div className="ba">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.before} alt={`${p.room} before cleaning`} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.after} alt={`${p.room} after cleaning`} style={{ clipPath: `inset(0 0 0 ${cut}%)` }} />
            <span className="tag" style={{ left: 10 }}>BEFORE</span>
            <span className="tag" style={{ right: 10 }}>AFTER</span>
            <div className="handle" style={{ left: `${cut}%` }} />
            <input type="range" min={0} max={100} value={cut} onChange={(e) => setCut(+e.target.value)} aria-label="Drag to compare before and after" />
          </div>
          {pairs.length > 1 && (
            <div className="rooms">
              {pairs.map((x, j) => <button key={x.room} aria-pressed={j === i} onClick={() => { setI(j); setCut(50); }}>{x.room}</button>)}
            </div>
          )}
        </div>
      )}
      {others.length > 0 && (
        <div className="gallery">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {others.map((o, j) => <a key={j} href={o.url} target="_blank" rel="noreferrer"><img src={o.url} alt={o.room ? `${o.room} photo` : "Visit photo"} /></a>)}
        </div>
      )}
    </div>
  );
}
