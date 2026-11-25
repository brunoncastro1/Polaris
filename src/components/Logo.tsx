import { brand } from "@/lib/config";

// Placeholder mark. To use the real Polaris logo, put it at public/logo.png and
// replace the <svg> below with: <img src="/logo.png" alt="" width={32} height={32} />
export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="brand">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="#0b2545" stroke="#e8b33a" strokeWidth="1.5" />
        <path d="M16 5l2.2 8.8L27 16l-8.8 2.2L16 27l-2.2-8.8L5 16l8.8-2.2z" fill="#e8b33a" />
      </svg>
      <span>{brand.name}<small>{brand.tagline}</small></span>
    </span>
  );
}
