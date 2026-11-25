"use client";
import { useActionState } from "react";
import { adminLogin, resendInvite, resendVisitEmail, type AdminState } from "./actions";

export function AdminLoginForm({ demo }: { demo: boolean }) {
  const [s, action, pending] = useActionState<AdminState, FormData>(adminLogin, {});
  return (
    <form action={action} style={{ display: "grid", gap: 14 }}>
      <label htmlFor="admin-pw">Admin password<input id="admin-pw" name="password" type="password" required defaultValue={demo ? "admin1234" : ""} /></label>
      {s.error && <p className="err" role="alert">{s.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "Checking…" : "Open admin"}</button>
      {demo && <p className="hint">Demo mode: the password is filled in.</p>}
    </form>
  );
}

export function InviteButton({ clientId, hasLogin }: { clientId: string; hasLogin: boolean }) {
  const [s, action, pending] = useActionState<AdminState, FormData>(resendInvite, {});
  return (
    <form action={action} className="act">
      <input type="hidden" name="clientId" value={clientId} />
      <button className="btn small" disabled={pending}>{hasLogin ? "Send password link" : "Send invite"}</button>
      {(s.message || s.error) && <span className={s.error ? "err" : "okmsg"}>{s.message || s.error}</span>}
    </form>
  );
}

export function ResendEmailButton({ visitId, sent }: { visitId: string; sent: boolean }) {
  const [s, action, pending] = useActionState<AdminState, FormData>(resendVisitEmail, {});
  return (
    <form action={action} className="act">
      <input type="hidden" name="visitId" value={visitId} />
      <button className="btn small ghosty" disabled={pending}>{sent ? "Resend email" : "Send email"}</button>
      {(s.message || s.error) && <span className={s.error ? "err" : "okmsg"}>{s.message || s.error}</span>}
    </form>
  );
}
