const TZ = process.env.NEXT_PUBLIC_TIMEZONE || "America/New_York";
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, ...opts });
export const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }) : "—";
export const duration = (a: string | null, b: string | null) => {
  if (!a || !b) return "—";
  const m = Math.round((+new Date(b) - +new Date(a)) / 60000);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
};
export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
