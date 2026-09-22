import { expect, test } from "@playwright/test";
import { allThemes } from "./helpers";

const family = (url: string): string | null => {
  const m = url.match(/\/_next\/static\/media\/([A-Za-z]+)[_-]/);
  return m ? m[1] : null;
};

test.describe("fonts: a page requests exactly its theme's two families (12A, D2)", () => {
  for (const theme of allThemes) {
    test(theme, async ({ page }) => {
      const fonts = new Set<string>();
      page.on("request", (r) => {
        if (r.resourceType() === "font" || /\.woff2(\?|$)/.test(r.url())) {
          const f = family(r.url());
          if (f) fonts.add(f);
        }
      });
      await page.goto(`/${theme}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const expected = theme === "hobbs" ? ["InstrumentSerif", "Manrope"] : ["InstrumentSerif", "Satoshi"];
      expect([...fonts].sort()).toEqual(expected);
      expect(fonts.size).toBe(2);
    });
  }

  test("dark requests no Manrope; hobbs requests no Satoshi", async ({ page }) => {
    const urls: string[] = [];
    page.on("request", (r) => urls.push(r.url()));
    await page.goto("/dark", { waitUntil: "networkidle" });
    expect(urls.some((u) => /Manrope/i.test(u))).toBe(false);
    urls.length = 0;
    await page.goto("/hobbs", { waitUntil: "networkidle" });
    expect(urls.some((u) => /Satoshi/i.test(u))).toBe(false);
  });
});
