import { agents } from "@/content/agents";
import { launchTheme } from "@/content/config";
import { properties } from "@/content/properties";
import type { ThemeId } from "@/content/themes";
import { stage } from "@/lib/stage";

/**
 * Every theme has three routes: /<theme>, /<theme>/for/[agent], and
 * /<theme>/p/[slug]. Params are static, so every page and OG image is
 * prebuilt; unknown slugs are 404s (dynamicParams = false), never redirects.
 */
export type RouteMatch =
  | { kind: "home" }
  | { kind: "agent"; slug: string }
  | { kind: "property"; slug: string };

/**
 * Once a launch theme is chosen, the other three exist on review links only.
 * At SITE_STAGE=live their routes 404 (design Next Steps 8: "the other three
 * roots stop existing").
 */
export function retiredAtLive(theme: ThemeId): boolean {
  return stage() === "live" && launchTheme !== null && theme !== launchTheme;
}

export function agentParams(): Array<{ agent: string }> {
  return agents.map((a) => ({ agent: a.slug }));
}

export function propertyParams(): Array<{ slug: string }> {
  return properties.map((p) => ({ slug: p.slug }));
}

export function routeTitle(match: RouteMatch): string | undefined {
  if (match.kind === "agent") {
    const a = agents.find((x) => x.slug === match.slug);
    return a ? `For ${a.displayName}` : undefined;
  }
  if (match.kind === "property") {
    const p = properties.find((x) => x.slug === match.slug);
    return p?.title;
  }
  return undefined;
}

export function ogPath(theme: ThemeId, match: RouteMatch): string {
  if (match.kind === "agent") return `/${theme}/for/${match.slug}/opengraph-image`;
  if (match.kind === "property") return `/${theme}/p/${match.slug}/opengraph-image`;
  return `/${theme}/opengraph-image`;
}
