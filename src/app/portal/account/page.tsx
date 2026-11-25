import { getPortalData } from "@/lib/data";
import { Fragment } from "react";
import { brand } from "@/lib/config";

export default async function Account() {
  const { client, visits } = (await getPortalData())!;
  const sites = [...new Map(visits.filter((v) => v.site).map((v) => [v.site!, v.siteAddress ?? ""])).entries()];
  const rows: [string, string][] = [["Company", client.name], ["Signed in as", client.contactName], ["Email", client.email], ["Phone", client.phone], ["Billing address", client.address],
    ["Service plan", client.plan], ["Site access", client.accessNotes], ["Special instructions", client.preferences]];
  return (
    <>
      <div className="sec-h"><h2>My info</h2></div>
      <div className="panel">
        <dl className="meta" style={{ gridTemplateColumns: "minmax(120px, auto) 1fr" }}>
          {rows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v || "—"}</dd></Fragment>)}
        </dl>
        {sites.length > 0 && <>
          <h3 style={{ fontSize: 15, marginTop: 20 }}>Buildings we service</h3>
          <ul className="checklist" style={{ marginTop: 8 }}>{sites.map(([n, a]) => <li key={n}><span><b>{n}</b>{a && <span className="sub"> · {a}</span>}</span></li>)}</ul>
        </>}
        <p className="hint" style={{ marginTop: 16 }}>Need to change something or give portal access to a colleague? Contact {brand.name}{brand.phone ? ` at ${brand.phone}` : ""}{brand.email ? ` or ${brand.email}` : ""} and we&apos;ll update it.</p>
      </div>
    </>
  );
}
