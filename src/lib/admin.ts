import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { demoMode } from "./config";

export const ADMIN_COOKIE = "polaris_admin";
export const DEMO_ADMIN_PASSWORD = "admin1234";

const secret = () => (demoMode ? DEMO_ADMIN_PASSWORD : process.env.ADMIN_SECRET || "");
const token = () => crypto.createHmac("sha256", secret()).update("polaris-admin-v1").digest("hex");

export function checkAdminPassword(pw: string) {
  const s = secret();
  if (!s) return false;
  const a = Buffer.from(pw), b = Buffer.from(s);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function setAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, token(), { httpOnly: true, secure: !demoMode, sameSite: "lax", path: "/admin", maxAge: 60 * 60 * 12 });
}

export async function isAdmin() {
  if (!secret()) return false;
  return (await cookies()).get(ADMIN_COOKIE)?.value === token();
}
