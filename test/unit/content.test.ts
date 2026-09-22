import { describe, expect, it } from "vitest";
import { agentHref, homeHref, href, propertyHref, workHref } from "@/lib/href";
import { serviceOrder, vocabulary } from "@/content/vocabulary";
import { agentParams, ogPath, propertyParams } from "@/site/routes";
import { ogPlaqueLine } from "@/site/og";
import { themeIds, themes, isThemeId } from "@/content/themes";

describe("href() (theme segment during review)", () => {
  it("prefixes the theme and collapses once launchTheme is set", () => {
    expect(href("dark")).toBe("/dark");
    expect(href("dark", "/for/jessica")).toBe("/dark/for/jessica");
    expect(homeHref("hobbs")).toBe("/hobbs");
    expect(workHref("light")).toBe("/light#work");
    expect(agentHref("twilight", "jessica")).toBe("/twilight/for/jessica");
    expect(propertyHref("dark", "ocean-ave")).toBe("/dark/p/ocean-ave");
  });
});

describe("vocabulary (14A)", () => {
  it("short forms are tracked caps; long forms are sentence case; order is Sam's", () => {
    expect(vocabulary.photography.short).toBe("PHOTO");
    expect(vocabulary.videography.short).toBe("FILM");
    expect(vocabulary.drone.short).toBe("AERIAL");
    expect(vocabulary.videography.long).toBe("Property films");
    expect(serviceOrder).toEqual(["photography", "videography", "drone"]);
  });
});

describe("routes", () => {
  it("static params cover every agent and property", () => {
    expect(agentParams()).toEqual([{ agent: "jessica" }]);
    expect(propertyParams()).toEqual([{ slug: "ocean-ave" }]);
  });
  it("OG image paths follow the route", () => {
    expect(ogPath("dark", { kind: "home" })).toBe("/dark/opengraph-image");
    expect(ogPath("dark", { kind: "agent", slug: "jessica" })).toBe("/dark/for/jessica/opengraph-image");
    expect(ogPath("hobbs", { kind: "property", slug: "ocean-ave" })).toBe("/hobbs/p/ocean-ave/opengraph-image");
  });
});

describe("OG plaque line (10A)", () => {
  it("home carries the trade; share links carry the personalization", () => {
    expect(ogPlaqueLine({ kind: "home" }).line).toBe("REAL ESTATE PHOTO·FILM·AERIAL");
    expect(ogPlaqueLine({ kind: "agent", slug: "jessica" }).line).toBe("PREPARED FOR JESSICA TRAN");
    expect(ogPlaqueLine({ kind: "property", slug: "ocean-ave" })).toMatchObject({ clipId: "placeholder-harbor", line: "1234 OCEAN AVE · FOR JESSICA TRAN" });
  });
});

describe("themes", () => {
  it("four themes; only hobbs has the still hero, kickers and numerals", () => {
    expect(themeIds).toEqual(["hobbs", "dark", "light", "twilight"]);
    expect(isThemeId("dark")).toBe(true);
    expect(isThemeId("neon")).toBe(false);
    for (const id of themeIds) {
      const t = themes[id];
      expect(t.hero === "still").toBe(id === "hobbs");
      expect(t.kickers).toBe(id === "hobbs");
      expect(t.numerals).toBe(id === "hobbs");
    }
  });
});
