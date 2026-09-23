import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/dark", "/light", "/twilight", "/hobbs", "/dark/for/jessica", "/dark/p/ocean-ave", "/dark/for/nobody"];

test.describe("accessibility contract (16A)", () => {
  for (const path of routes) {
    test(`axe clean: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(500);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
        // Text over footage is asserted by contrast.spec.ts with the real scrim math; axe cannot see video.
        .disableRules(["color-contrast"])
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }

  test("landmarks: one header, one main, one footer; sections labelled", async ({ page }) => {
    for (const path of ["/dark", "/hobbs", "/dark/for/jessica"]) {
      await page.goto(path);
      expect(await page.locator("header").count(), path).toBe(1);
      expect(await page.locator("main").count(), path).toBe(1);
      expect(await page.locator("footer").count(), path).toBe(1);
      expect(await page.locator("h1").count(), path).toBe(1);
      const unlabeled = await page.locator("main section:not([aria-labelledby]):not([aria-label])").count();
      expect(unlabeled, path).toBe(0);
    }
  });

  test("every tappable element is at least 44px on its shortest side", async ({ page }) => {
    for (const path of ["/dark", "/hobbs", "/dark/for/jessica"]) {
      await page.goto(path);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const small = await page.locator("a, button, [role='button']").evaluateAll((els) =>
        els
          .map((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return { text: (el.textContent ?? "").trim().slice(0, 30), w: r.width, h: r.height, hidden: cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0 || r.width === 0 };
          })
          .filter((x) => !x.hidden && Math.min(x.w, x.h) < 44),
      );
      expect(small, path).toEqual([]);
    }
  });

  test("focus ring is never removed; frames are focusable with the clip title as their name", async ({ page }) => {
    await page.goto("/dark");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, outline: cs.outlineStyle, width: cs.outlineWidth };
    });
    expect(focused.outline).not.toBe("none");
    expect(focused.width).not.toBe("0px");
    const frame = page.locator(".frame").first();
    await expect(frame).toHaveAttribute("tabindex", "0");
    await expect(frame).toHaveAttribute("aria-label", /play or pause: .+/i);
    await expect(frame.locator("video")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(".hero-video")).toHaveAttribute("aria-hidden", "true");
  });

  test("body text is at least 16px; tracked labels are in rem; nothing clips at 200% zoom", async ({ page }) => {
    await page.goto("/dark");
    const bodyPx = await page.locator("#about p").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(bodyPx).toBeGreaterThanOrEqual(16);
    // Simulate 200% zoom via root font-size; tracked labels must scale with it.
    const before = await page.locator("#contact .fact-label").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
    const after = await page.locator("#contact .fact-label").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(after).toBeCloseTo(before * 2, 0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });

  test("facts row stacks to one column below 400px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await page.goto("/dark");
    const cols = await page.locator("#contact .facts").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(cols).toBe(1);
  });
});
