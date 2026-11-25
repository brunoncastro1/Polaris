import { getPortalData } from "@/lib/data";
import { fmtDate, money } from "@/lib/format";

const label = (s: string) => ({ paid: "Paid", awaiting_payment: "Awaiting payment", past_due: "Past due", bad_debt: "Past due" } as Record<string, string>)[s] ?? (s ? s.replace(/_/g, " ") : "—");

export default async function Billing() {
  const { invoices } = (await getPortalData())!;
  const due = invoices.reduce((a, i) => a + i.balance, 0);
  const year = new Date().getFullYear();
  const paidYear = invoices.filter((i) => i.issuedAt.startsWith(String(year))).reduce((a, i) => a + (i.total - i.balance), 0);
  const payable = invoices.find((i) => i.balance > 0 && i.paymentUrl);
  return (
    <>
      <div className="sec-h"><h2>Billing</h2></div>
      <div className="grid3">
        <div className="panel"><div className="k">Balance due</div><div className="v">{money(due)}</div></div>
        <div className="panel"><div className="k">Paid in {year}</div><div className="v">{money(paidYear)}</div></div>
        <div className="panel" style={{ display: "grid", alignContent: "center", gap: 8 }}>
          {payable ? <a className="btn" href={payable.paymentUrl!} target="_blank" rel="noreferrer">Pay {money(due)} securely</a>
                   : <span className="pill ok" style={{ justifySelf: "start" }}>{due > 0 ? "Payment link coming soon" : "Nothing to pay"}</span>}
          <span className="hint">Payments are processed by Jobber.</span>
        </div>
      </div>
      {invoices.length ? (
        <div className="panel tbl"><table>
          <thead><tr><th>Invoice</th><th>Date</th><th>Service</th><th className="r">Amount</th><th className="r">Balance</th><th>Status</th></tr></thead>
          <tbody>{invoices.map((i) => (
            <tr key={i.id}><td>#{i.number}</td><td>{fmtDate(i.issuedAt)}</td><td>{i.subject}</td><td className="r">{money(i.total)}</td><td className="r">{money(i.balance)}</td>
              <td><span className={`pill ${i.balance > 0 ? "warn" : "ok"}`}>{label(i.status)}</span></td></tr>
          ))}</tbody>
        </table></div>
      ) : <div className="panel empty">Your invoices will be listed here.</div>}
    </>
  );
}
