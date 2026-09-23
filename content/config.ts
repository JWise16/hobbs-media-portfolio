import type { ThemeId } from "./themes";

/**
 * Set once Sam picks a theme. While null, all four themes build and links
 * carry the theme segment. Setting it makes `href()` emit theme-less paths;
 * the matching root rewrite and 301s in next.config are the launch step in the
 * design doc (Next Steps 8) and are added then, not before.
 */
export const launchTheme: ThemeId | null = null;

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
