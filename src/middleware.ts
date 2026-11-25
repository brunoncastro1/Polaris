import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const demo = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(req: NextRequest) {
  if (demo) {
    if (req.nextUrl.pathname.startsWith("/portal") && req.cookies.get("polaris_demo")?.value !== "1")
      return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser(); // refreshes the session cookie
  if (!user && (req.nextUrl.pathname.startsWith("/portal") || req.nextUrl.pathname.startsWith("/team") || req.nextUrl.pathname.startsWith("/set-password")))
    return NextResponse.redirect(new URL("/login", req.url));
  return res;
}

export const config = { matcher: ["/portal/:path*", "/team/:path*", "/set-password", "/login"] };
