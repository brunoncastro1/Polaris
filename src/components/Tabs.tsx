"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/visits", label: "Visits & photos" },
  { href: "/portal/billing", label: "Billing" },
  { href: "/portal/account", label: "My info" },
];

export default function Tabs() {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Portal sections"><div className="wrap">
      {tabs.map((t) => {
        const active = t.href === "/portal" ? path === "/portal" : path.startsWith(t.href);
        return <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}>{t.label}</Link>;
      })}
    </div></nav>
  );
}
