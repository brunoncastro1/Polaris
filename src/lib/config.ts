export const brand = {
  name: "Polaris",
  tagline: "Client Portal",
  phone: "", // e.g. "(508) 555-0100" — shown in the footer when set
  email: "",
  website: "", // e.g. "https://www.polarisbioclean.com"
};

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Demo mode: no Supabase configured → sample data and a demo login. */
export const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const DEMO_EMAIL = "demo@polaris.example";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_COOKIE = "polaris_demo";
