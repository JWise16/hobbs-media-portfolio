import type { ThemeId } from "@/content/themes";
import { launchTheme } from "@/content/config";

/**
 * Every internal link goes through here. During review paths carry the theme
 * segment (/dark/for/jessica). Once a theme is chosen and `launchTheme` is
 * set, links become theme-less (/for/jessica) and next.config rewrites the
 * root onto the chosen segment (design doc, Next Steps 8).
 */
export function href(theme: ThemeId, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (launchTheme && launchTheme === theme) return clean;
  return clean === "/" ? `/${theme}` : `/${theme}${clean}`;
}

export function homeHref(theme: ThemeId): string {
  return href(theme, "/");
}

export function workHref(theme: ThemeId): string {
  return `${href(theme, "/")}#work`;
}

export function agentHref(theme: ThemeId, slug: string): string {
  return href(theme, `/for/${slug}`);
}

export function propertyHref(theme: ThemeId, slug: string): string {
  return href(theme, `/p/${slug}`);
}
