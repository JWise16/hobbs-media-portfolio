import { expect, test } from "@playwright/test";
import { clips } from "../../content/clips.generated";
import { contrastRatio, ghostedBackdrop, heroBackdrop, parseColor, relativeLuminance, type RGB } from "../../lib/contrast";
import { cinematic } from "./helpers";

/**
 * Design 1A: 4.5:1 body and 3:1 plaque contrast against the darkest and
 * lightest hero posters. The poster's central region (where the wordmark
 * and plaque sit) is sampled in the browser; the scrim math is applied
 * exactly as the CSS does at scroll 0 (worst case, no dim).
 */

async function samplePoster(page: import("@playwright/test").Page, url: string): Promise<{ mean: RGB; brightest: RGB }> {
  return page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    // Central text region: 30%..70% wide, 35%..65% tall.
    const x0 = Math.floor(c.width * 0.3);
    const x1 = Math.floor(c.width * 0.7);
    const y0 = Math.floor(c.height * 0.35);
    const y1 = Math.floor(c.height * 0.65);
    const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    let best: [number, number, number] = [0, 0, 0];
    let bestL = -1;
    for (let i = 0; i < d.length; i += 16) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
      n++;
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      if (l > bestL) {
        bestL = l;
        best = [d[i], d[i + 1], d[i + 2]];
      }
    }
    return { mean: [Math.round(r / n), Math.round(g / n), Math.round(b / n)] as [number, number, number], brightest: best };
  }, url);
}

test.describe("text over footage keeps contrast on the darkest and lightest posters", () => {
  test("hero plaque and wordmark ≥ 3:1; ghosted beat two body ≥ 4.5:1", async ({ page }) => {
    await page.goto("/dark");
    const posters = Object.values(clips).map((c) => c.files.poster);
    const samples = await Promise.all(posters.map((p) => samplePoster(page, p)));
    const byLum = samples.map((s, i) => ({ s, i, lum: relativeLuminance(s.mean) })).sort((a, b) => a.lum - b.lum);
    const extremes = [byLum[0], byLum[byLum.length - 1]];

    for (const theme of cinematic) {
      await page.goto(`/${theme}`);
      const tokens = await page.locator("[data-theme]").evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          heroText: cs.getPropertyValue("--hero-text").trim(),
          tint: cs.getPropertyValue("--overlay-tint").trim(),
          surface: cs.getPropertyValue("--surface").trim(),
          text: cs.getPropertyValue("--text").trim(),
          muted: cs.getPropertyValue("--muted").trim(),
        };
      });
      const tintMatch = tokens.tint.match(/rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)/);
      const tintRgb: RGB = tintMatch ? [Number(tintMatch[1]), Number(tintMatch[2]), Number(tintMatch[3])] : [0, 0, 0];
      const tintAlpha = tintMatch ? Number(tintMatch[4]) : 0;

      for (const { s, i } of extremes) {
        // Worst case: the brightest pixel in the text region, then the mean.
        for (const px of [s.brightest, s.mean]) {
          const backdrop = heroBackdrop(px, tintRgb, tintAlpha);
          const plaque = contrastRatio(parseColor(tokens.heroText), backdrop);
          expect(plaque, `${theme} plaque over ${posters[i]}`).toBeGreaterThanOrEqual(3);
        }
        const ghost = ghostedBackdrop(s.brightest, parseColor(tokens.surface));
        expect(contrastRatio(parseColor(tokens.text), ghost), `${theme} beat-two body over ${posters[i]}`).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(parseColor(tokens.muted), ghost), `${theme} beat-two muted over ${posters[i]}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
