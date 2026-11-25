import { brand } from "@/lib/config";

// Official Polaris Pro Clean logo (white version, for dark backgrounds), from polarisproclean.com.
export default function Logo({ height = 40 }: { height?: number }) {
  return (
    <span className="brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-white.png" alt={brand.name} height={height} style={{ height, width: "auto" }} />
      <small className="brand-tag">{brand.tagline}</small>
    </span>
  );
}
