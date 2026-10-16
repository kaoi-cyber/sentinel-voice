import type { NextConfig } from "next";

// NEXT_PUBLIC_STATIC_DEMO=1 builds the GitHub Pages edition: plain static files under
// /sentinel-voice, no server routes (the Pages workflow removes src/app/api before building).
// Without it, this is the full local app with its API routes — unchanged.
const isStatic = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";
const basePath = isStatic ? "/sentinel-voice" : "";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // No Next.js dev badge in the corner (cleaner demos and screenshots).
  devIndicators: false,
  ...(isStatic
    ? { output: "export", distDir: ".next-static", basePath, trailingSlash: true, images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
