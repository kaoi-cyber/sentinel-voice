// True in the GitHub Pages edition (static files, no server). See next.config.ts.
export const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** Prefix a public file path with the site's base path ("/sentinel-voice" on GitHub Pages). */
export const asset = (p: string) => BASE + p;
