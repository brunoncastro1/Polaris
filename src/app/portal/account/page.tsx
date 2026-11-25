import { getPortalData } from "@/lib/data";
import { Fragment } from "react";
import { brand } from "@/lib/config";

export default async function Account() {
  const { client } = (await getPortalData())!;
  const rows: [string, string][] = [["Contact", client.name], ["Email", client.email], ["Phone", client.phone], ["Service address", client.address],
    ["Service plan", client.plan], ["Site access", client.accessNotes], ["Special instructions", client.preferences]];
  return (
    <>
      <div className="sec-h"><h2>My info</h2></div>
      <div className="panel">
        <dl className="meta" style={{ gridTemplateColumns: "minmax(120px, auto) 1fr" }}>
          {rows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v || "—"}</dd></Fragment>)}
        </dl>
        <p className="hint" style={{ marginTop: 16 }}>Need to change something? Contact {brand.name}{brand.phone ? ` at ${brand.phone}` : ""}{brand.email ? ` or ${brand.email}` : ""} and we&apos;ll update it.</p>
      </div>
    </>
  );
}
