"use client";
import { useActionState } from "react";
import Logo from "@/components/Logo";
import { setPassword } from "./actions";

export default function SetPasswordPage() {
  const [state, action, pending] = useActionState(setPassword, {} as { error?: string });
  return (
    <div className="auth">
      <form className="auth-card" action={action}>
        <div className="auth-logo" style={{ background: "var(--navy)", margin: "-32px -28px 0", padding: "24px", borderRadius: "16px 16px 0 0" }}><Logo height={48} /></div>
        <div><h1 style={{ fontSize: 22 }}>Set your password</h1><p className="hint">You&apos;ll use it with your email to sign in.</p></div>
        <label htmlFor="password">New password<input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <label htmlFor="confirm">Repeat password<input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required /></label>
        {state.error && <p className="err" role="alert">{state.error}</p>}
        <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save and continue"}</button>
      </form>
    </div>
  );
}
