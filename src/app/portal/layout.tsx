import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import Tabs from "@/components/Tabs";
import { getPortalData } from "@/lib/data";
import { brand, demoMode } from "@/lib/config";
import { signOut } from "../login/actions";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const data = await getPortalData();
  if (!data) redirect("/login");
  return (
    <>
      {demoMode && <div className="demo-bar">Demo mode · sample data</div>}
      <header className="top"><div className="wrap">
        <Logo />
        <div className="who"><span>{data.client.name}</span>
          <form action={signOut}><button className="btn ghost" type="submit">Log out</button></form>
        </div>
      </div></header>
      <Tabs />
      <main className="wrap">{children}</main>
      <footer className="foot wrap">
        {brand.name}{brand.phone && <> · {brand.phone}</>}{brand.email && <> · {brand.email}</>}
        {" · "}Questions about a visit? Contact us anytime.
      </footer>
    </>
  );
}
