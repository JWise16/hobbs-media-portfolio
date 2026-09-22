import { expect, test } from "@playwright/test";
import { playingVideos, scrollToFraction, scrollToSelector, waitForHeroPlaying } from "./helpers";

test.describe("VideoBudget: one decoder at a time", () => {
  test("exactly one video plays at five scroll positions; closest to center wins", async ({ page }) => {
    await page.goto("/dark");
    await waitForHeroPlaying(page);
    expect(await playingVideos(page)).toHaveLength(1);

    const frames = page.locator(".frame");
    const n = await frames.count();
    expect(n).toBeGreaterThanOrEqual(3);

    const positions = [
      async () => scrollToFraction(page, 0.5),
      async () => scrollToSelector(page, ".frame:nth-child(1)"),
      async () => scrollToSelector(page, ".frame:nth-child(2)"),
      async () => scrollToSelector(page, ".frame:nth-child(3)"),
      async () => scrollToSelector(page, "#contact"),
    ];
    for (const go of positions) {
      await go();
      await expect.poll(async () => (await playingVideos(page)).length, { timeout: 8000 }).toBeLessThanOrEqual(1);
    }

    // Centered on frame 2: frame 2 plays, no other.
    await scrollToSelector(page, ".frame:nth-child(2)");
    const secondClip = await frames.nth(1).locator("video").getAttribute("data-clip");
    await expect.poll(async () => playingVideos(page), { timeout: 8000 }).toEqual([secondClip]);
    await expect(frames.nth(1).locator("video")).toHaveAttribute("data-state", "playing");
    await expect(frames.nth(0).locator("video")).not.toHaveAttribute("data-state", "playing");
  });

  test("posters visible before play; src attached within one viewport and released beyond two", async ({ page }) => {
    await page.goto("/dark");
    await waitForHeroPlaying(page);
    const frames = page.locator(".frame");
    await expect(frames.nth(0).locator("img.frame-poster")).toHaveAttribute("loading", "lazy");
    const last = frames.nth((await frames.count()) - 1).locator("video");
    // Far below: detached.
    expect(await last.getAttribute("src")).toBeNull();
    expect(await last.getAttribute("preload")).toBe("none");
    await scrollToSelector(page, `.frame:nth-child(${await frames.count()})`);
    await expect(last).toHaveAttribute("src", /\.mp4$/);
    // Back to the top: more than two viewports away, released.
    await scrollToFraction(page, 0);
    await page.waitForTimeout(400);
    await expect.poll(async () => last.getAttribute("src")).toBeNull();
  });

  test("scroll back to the top: hero re-attaches and plays", async ({ page }) => {
    await page.goto("/dark");
    await waitForHeroPlaying(page);
    await scrollToSelector(page, "#contact");
    await expect(page.locator(".hero-video")).not.toHaveAttribute("data-state", "playing");
    await scrollToFraction(page, 0);
    await waitForHeroPlaying(page);
  });

  test("hidden tab pauses everything; visible resumes", async ({ page }) => {
    await page.goto("/dark");
    await waitForHeroPlaying(page);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(async () => (await playingVideos(page)).length, { timeout: 5000 }).toBe(0);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await waitForHeroPlaying(page);
  });

  test("tap-to-pause: tap pauses and shows the affordance; tap resumes; Space toggles (6B)", async ({ page }) => {
    await page.goto("/dark");
    await waitForHeroPlaying(page);
    await scrollToSelector(page, ".frame:nth-child(1)");
    const frame = page.locator(".frame").first();
    const video = frame.locator("video");
    await expect(video).toHaveAttribute("data-state", "playing", { timeout: 8000 });
    await frame.click({ position: { x: 40, y: 40 } });
    await expect(video).toHaveAttribute("data-state", "paused");
    await expect(frame.locator(".affordance")).toHaveCSS("opacity", "1");
    await frame.click({ position: { x: 40, y: 40 } });
    await expect(video).toHaveAttribute("data-state", "playing", { timeout: 8000 });
    await expect(frame.locator(".affordance")).toHaveCSS("opacity", "0");
    await frame.focus();
    await page.keyboard.press("Space");
    await expect(video).toHaveAttribute("data-state", "paused");
    await page.keyboard.press("Space");
    await expect(video).toHaveAttribute("data-state", "playing", { timeout: 8000 });
  });

  test("hero tap-to-pause via the frame", async ({ page }) => {
    await page.goto("/dark");
    await waitForHeroPlaying(page);
    const box = (await page.locator(".hero-frame").boundingBox())!;
    const spot = { position: { x: 30, y: Math.round(box.height * 0.8) } };
    await page.locator(".hero-frame").click(spot);
    await expect(page.locator(".hero-video")).toHaveAttribute("data-state", "paused");
    await expect(page.locator(".hero .affordance")).toHaveCSS("opacity", "1");
    await page.locator(".hero-frame").click(spot);
    await waitForHeroPlaying(page);
  });

  test("blocked play() shows the tap affordance (Low Power Mode stand-in)", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLMediaElement.prototype.play;
      let calls = 0;
      HTMLMediaElement.prototype.play = function () {
        calls++;
        if (calls === 1) return Promise.reject(new DOMException("NotAllowedError", "NotAllowedError"));
        return orig.call(this);
      };
    });
    await page.goto("/dark");
    await expect(page.locator(".hero-video")).toHaveAttribute("data-hero-state", "blocked", { timeout: 15_000 });
    await expect(page.locator(".hero .affordance")).toHaveCSS("opacity", "1");
    const box = (await page.locator(".hero-frame").boundingBox())!;
    await page.locator(".hero-frame").click({ position: { x: 30, y: Math.round(box.height * 0.8) } });
    await waitForHeroPlaying(page);
  });
});
