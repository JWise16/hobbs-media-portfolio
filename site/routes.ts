import { agents } from "@/content/agents";
import { properties } from "@/content/properties";
import type { ThemeId } from "@/content/themes";

/**
 * Every theme has one optional catch-all route, /<theme>/[[...path]], that
 * resolves to the home page, /for/[agent], or /p/[slug]. The list of paths is
 * static, so every page is prebuilt and unknown slugs are 404s, never redirects.
 */
export type RouteMatch =
  | { kind: "home" }
  | { kind: "agent"; slug: string }
  | { kind: "property"; slug: string };

export function matchRoute(segments: string[] | undefined): RouteMatch | null {
  const s = segments ?? [];
  if (s.length === 0) return { kind: "home" };
  if (s.length === 2 && s[0] === "for" && agents.some((a) => a.slug === s[1])) return { kind: "agent", slug: s[1] };
  if (s.length === 2 && s[0] === "p" && properties.some((p) => p.slug === s[1])) return { kind: "property", slug: s[1] };
  return null;
}

export function staticPaths(): Array<{ path: string[] | undefined }> {
  return [
    { path: undefined },
    ...agents.map((a) => ({ path: ["for", a.slug] })),
    ...properties.map((p) => ({ path: ["p", p.slug] })),
  ];
}

export function routeTitle(match: RouteMatch): string | undefined {
  if (match.kind === "agent") {
    const a = agents.find((x) => x.slug === match.slug)!;
    return `For ${a.displayName}`;
  }
  if (match.kind === "property") {
    const p = properties.find((x) => x.slug === match.slug)!;
    return p.title;
  }
  return undefined;
}

export function ogPath(theme: ThemeId, segments: string[] | undefined): string {
  const s = segments ?? [];
  return `/${theme}${s.length ? `/${s.join("/")}` : ""}/opengraph-image`;
}
