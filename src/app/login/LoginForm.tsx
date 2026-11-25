"use client";
import { useActionState } from "react";
import { signIn, sendReset, type FormState } from "./actions";

export default function LoginForm({ demo, demoEmail, demoPassword }: { demo: boolean; demoEmail: string; demoPassword: string }) {
  const [state, login, pending] = useActionState<FormState, FormData>(signIn, {});
  const [reset, resetAction, resetting] = useActionState<FormState, FormData>(sendReset, {});
  return (
    <form action={login} style={{ display: "grid", gap: 16 }}>
      <label htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="username" required defaultValue={demo ? demoEmail : ""} /></label>
      <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="current-password" required defaultValue={demo ? demoPassword : ""} /></label>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      {reset.error && <p className="err" role="alert">{reset.error}</p>}
      {reset.message && <p className="okmsg">{reset.message}</p>}
      <button className="btn" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      <button className="btn link" formAction={resetAction} formNoValidate disabled={resetting} style={{ justifySelf: "start" }}>Forgot password?</button>
    </form>
  );
}
