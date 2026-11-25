import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";
import { demoMode, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/config";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ signedout?: string }> }) {
  const { signedout } = await searchParams;
  return (
    <div className="auth">
      <div className="auth-card">
        <Logo />
        <div><h1 style={{ fontSize: 22 }}>Sign in</h1><p className="hint">See your visits, before &amp; after photos and account.</p></div>
        {signedout && <p className="okmsg">You&apos;re signed out.</p>}
        <LoginForm demo={demoMode} demoEmail={DEMO_EMAIL} demoPassword={DEMO_PASSWORD} />
        {demoMode
          ? <p className="hint">Demo mode with sample data. The login above is filled in.</p>
          : <p className="hint">New client? Check your email for the invitation from Polaris to set your password.</p>}
      </div>
    </div>
  );
}
