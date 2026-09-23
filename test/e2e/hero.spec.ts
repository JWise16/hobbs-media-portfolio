import { expect, test } from "@playwright/test";
import { cinematic, heroProgress, scrollToFraction, waitForHeroPlaying } from "./helpers";

test.describe("hero island and playback start", () => {
  test("no autoplay attribute anywhere; hero is a raw island with the 720 rung server-rendered", async ({ page }) => {
    const res = await page.goto("/dark");
    const html = (await res!.text()).toLowerCase();
    expect(html).not.toMatch(/<video[^>]*\sautoplay/);
    expect(html).toMatch(/<video[^>]*class="hero-video"[^>]*src="\/clips\/[^"]+\.720\.mp4"/);
    expect(html).toMatch(/<\/video><script>/);
    expect(await page.locator("video[autoplay]").count()).toBe(0);
  });

  test("poster is requested before the mp4 (9A) and the hero plays", async ({ page }) => {
    const order: string[] = [];
    page.on("request", (r) => {
      const u = r.url();
      if (u.includes("/clips/")) order.push(u);
    });
    await page.goto("/dark");
    await waitForHeroPlaying(page);
    const firstPoster = order.findIndex((u) => u.endsWith(".jpg"));
    const firstMp4 = order.findIndex((u) => u.endsWith(".mp4"));
    expect(firstPoster).toBeGreaterThanOrEqual(0);
    expect(firstMp4).toBeGreaterThanOrEqual(0);
    expect(firstPoster).toBeLessThan(firstMp4);
    expect(await page.locator(".hero-video").getAttribute("data-hero-init")).toBe("1");
    expect(await page.locator(".hero-video").getAttribute("preload")).toBe("auto");
  });

  test("rung: 1080 on desktop, 720 on the phone, chosen before first play", async ({ page, isMobile }) => {
    const mp4s: string[] = [];
    page.on("request", (r) => {
      if (r.url().endsWith(".mp4")) mp4s.push(r.url());
    });
    await page.goto("/dark");
    await waitForHeroPlaying(page);
    const rung = isMobile ? "720" : "1080";
    expect(await page.locator(".hero-video").getAttribute("data-rung")).toBe(rung);
    expect(await page.locator(".hero-video").getAttribute("src")).toContain(`.${rung}.mp4`);
    // The chosen rung is what was fetched for playback (the parser may touch the
    // server-rendered 720 src for metadata before the inline script swaps it).
    const hero = await page.locator(".hero-video").getAttribute("data-clip");
    expect(mp4s.some((u) => u.includes(hero!) && u.includes(`.${rung}.mp4`))).toBe(true);
  });

  for (const theme of cinematic) {
    test(`${theme}: dim runs over 0.6svh, header appears at progress 1, cue fades`, async ({ page }) => {
      await page.goto(`/${theme}`);
      await waitForHeroPlaying(page);
      expect((await heroProgress(page)).p).toBe(0);
      await expect(page.locator(".site-header")).toHaveAttribute("data-visible", "0");
      await scrollToFraction(page, 0.3);
      const mid = await heroProgress(page);
      expect(mid.p).toBeCloseTo(0.5, 1);
      expect(mid.state).toBe("mid");
      await scrollToFraction(page, 0.6);
      const done = await heroProgress(page);
      expect(done.p).toBe(1);
      expect(done.pe).toBe(1);
      await expect(page.locator(".site-header")).toHaveAttribute("data-visible", "1");
      const dimOpacity = await page.locator(".hero-dim").evaluate((el) => getComputedStyle(el).opacity);
      expect(Number(dimOpacity)).toBeCloseTo(0.86, 2);
      const surface = await page.locator("[data-theme]").evaluate((el) => getComputedStyle(el).getPropertyValue("--dim-target").trim());
      const dimBg = await page.locator(".hero-dim").evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(surface.length).toBeGreaterThan(0);
      expect(dimBg).not.toBe("rgb(0, 0, 0)"); // dims to the theme surface, never pure black
      await scrollToFraction(page, 0);
      await expect(page.locator(".site-header")).toHaveAttribute("data-visible", "0");
    });
  }

  test("hobbs: still hero paints, header visible from the top, no reel", async ({ page }) => {
    await page.goto("/hobbs");
    await expect(page.locator(".hobbs-hero img")).toBeVisible();
    await expect(page.locator(".site-header")).toHaveAttribute("data-visible", "1");
    expect(await page.locator(".hero-video").count()).toBe(0);
    await expect(page.locator(".site-header")).toHaveAttribute("data-past-hero", "0");
    await page.evaluate(() => window.scrollTo(0, window.innerHeight + 10));
    await page.waitForTimeout(300);
    await expect(page.locator(".site-header")).toHaveAttribute("data-past-hero", "1");
  });

  test("hero video error after the poster: poster stays, page unaffected", async ({ page }) => {
    await page.route("**/clips/*.mp4", (route) => route.abort());
    await page.goto("/dark");
    // The island tries the 720 rung after the 1080 rung fails (desktop), then reports the error.
    await expect(page.locator(".hero-video")).toHaveAttribute("data-hero-state", /^(error|blocked)$/, { timeout: 15_000 });
    await expect(page.locator(".hero-video")).not.toHaveAttribute("data-state", "playing");
    await expect(page.locator(".hero-video")).toHaveAttribute("poster", /\.jpg$/);
    await expect(page.locator(".wordmark-hero")).toBeVisible();
  });

  test("share → work → back: client-nav init plays with the right rung (T3)", async ({ page, isMobile }) => {
    await page.goto("/dark/for/jessica");
    await waitForHeroPlaying(page);
    await scrollToFraction(page, 1);
    await page.getByRole("link", { name: /selected work/i }).click();
    await expect(page).toHaveURL(/\/dark#work$/);
    await expect(page.locator("#work")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/dark\/for\/jessica$/);
    await expect(page.locator(".hero-video")).toHaveAttribute("data-hero-init", "1");
    await waitForHeroPlaying(page);
    expect(await page.locator(".hero-video").getAttribute("data-rung")).toBe(isMobile ? "720" : "1080");
  });
});
