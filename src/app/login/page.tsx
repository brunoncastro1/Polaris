import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";
import { demoMode, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/config";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ signedout?: string }> }) {
  const { signedout } = await searchParams;
  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-logo" style={{ background: "var(--navy)", margin: "-32px -28px 0", padding: "24px", borderRadius: "16px 16px 0 0" }}><Logo height={48} /></div>
        <div><h1 style={{ fontSize: 22 }}>Sign in</h1><p className="hint">Service reports, before &amp; after photos and invoices for your facility.</p></div>
        {signedout && <p className="okmsg">You&apos;re signed out.</p>}
        <LoginForm demo={demoMode} demoEmail={DEMO_EMAIL} demoPassword={DEMO_PASSWORD} />
        {demoMode
          ? <p className="hint">Demo mode with sample data. The login above is filled in.</p>
          : <p className="hint">New client? Check your email for the invitation from Polaris Pro Clean to set your password.</p>}
      </div>
    </div>
  );
}
