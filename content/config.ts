import type { ThemeId } from "./themes";

/**
 * Sam picked `dark` on 2026-09-24. With a theme set, `href()` emits
 * theme-less paths and next.config serves the root from /dark (rewrite) and
 * 301s /dark/* to /* (design doc, Next Steps 8). At SITE_STAGE=live the other
 * three themes stop existing (their routes 404); on review links they remain.
 */
export const launchTheme: ThemeId | null = "dark";

/** The theme the bare root redirects to during review (the mockup reference). */
export const reviewTheme: ThemeId = "dark";

/**
 * Public site URL for og:image. Production prefers the project's stable
 * domain over the per-deployment host; previews fall back to VERCEL_URL.
 * The guard requires SITE_URL at SITE_STAGE=live.
 */
export function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
