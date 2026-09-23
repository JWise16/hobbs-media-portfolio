import { expect, test } from "@playwright/test";
import { scrollToFraction, scrollToSelector } from "./helpers";

test.describe("prefers-reduced-motion: posters only, normal flow", () => {
  test("no mp4 is requested, hero stays a poster in normal flow, stack shows posters", async ({ page }) => {
    const mp4s: string[] = [];
    page.on("request", (r) => {
      if (r.url().endsWith(".mp4")) mp4s.push(r.url());
    });
    await page.goto("/dark", { waitUntil: "networkidle" });
    await expect(page.locator(".hero-video")).toHaveAttribute("data-hero-state", "reduced");
    expect(await page.locator(".hero").evaluate((el) => getComputedStyle(el).position)).toBe("relative");
    expect(await page.locator(".hero-dim").evaluate((el) => getComputedStyle(el).display)).toBe("none");
    await scrollToFraction(page, 0.5);
    await scrollToSelector(page, ".frame:nth-child(2)");
    await page.waitForTimeout(800);
    const srcs = await page.locator(".frame video").evaluateAll((els) => els.map((e) => e.getAttribute("src")));
    expect(srcs.every((s) => s === null)).toBe(true);
    const playing = await page.evaluate(() => [...document.querySelectorAll("video")].filter((v) => !v.paused).length);
    expect(playing).toBe(0);
    // The server-rendered hero src is metadata-only; nothing else is fetched.
    expect(mp4s.filter((u) => !u.includes("placeholder-dusk"))).toEqual([]);
  });

  test("calling card: contact sits directly beneath a static poster hero", async ({ page }) => {
    await page.goto("/dark/for/jessica", { waitUntil: "networkidle" });
    await expect(page.locator(".hero-video")).toHaveAttribute("data-hero-state", "reduced");
    await scrollToFraction(page, 1);
    await expect(page.getByRole("heading", { level: 2, name: /jessica tran/i })).toBeVisible();
    await expect(page.locator(".hero-text")).toHaveCSS("opacity", "1");
  });
});
