import type { ThemeId } from "./themes";

/**
 * Set once Sam picks a theme. While null, all four themes build and links
 * carry the theme segment. Once set, `generateStaticParams` returns only this
 * theme and `href()` emits theme-less paths.
 */
export const launchTheme: ThemeId | null = null;

/** Public site URL for og:image. Previews fall back to VERCEL_URL. */
export function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
