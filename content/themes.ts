/**
 * The four review themes. Colors live in styles/tokens.css under [data-theme];
 * this file holds the structural switches. Hero treatment is the only
 * structural difference between `hobbs` and the cinematic three.
 */

export const themeIds = ["hobbs", "dark", "light", "twilight"] as const;
export type ThemeId = (typeof themeIds)[number];

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  /** reel = cinematic full-bleed loop with scroll dim; still = Sam's Lovable hero. */
  hero: "reel" | "still";
  support: "satoshi" | "manrope";
  /** Cinematic themes drop kickers and numerals (11A); hobbs keeps them. */
  kickers: boolean;
  numerals: boolean;
  /** Header: cinematic appears at scroll progress 1; hobbs is static from the top (18A). */
  header: "on-progress" | "static-then-sticky";
}

export const themes: Record<ThemeId, ThemeConfig> = {
  hobbs: {
    id: "hobbs",
    label: "Hobbs",
    hero: "still",
    support: "manrope",
    kickers: true,
    numerals: true,
    header: "static-then-sticky",
  },
  dark: {
    id: "dark",
    label: "Dark",
    hero: "reel",
    support: "satoshi",
    kickers: false,
    numerals: false,
    header: "on-progress",
  },
  light: {
    id: "light",
    label: "Light",
    hero: "reel",
    support: "satoshi",
    kickers: false,
    numerals: false,
    header: "on-progress",
  },
  twilight: {
    id: "twilight",
    label: "Twilight",
    hero: "reel",
    support: "satoshi",
    kickers: false,
    numerals: false,
    header: "on-progress",
  },
};

export function isThemeId(value: string): value is ThemeId {
  return (themeIds as readonly string[]).includes(value);
}

export function isCinematic(theme: ThemeId): boolean {
  return themes[theme].hero === "reel";
}
