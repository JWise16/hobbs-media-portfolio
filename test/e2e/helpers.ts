import { expect, type Page } from "@playwright/test";

export const cinematic = ["dark", "light", "twilight"] as const;
export const allThemes = ["hobbs", ...cinematic] as const;

export async function scrollToFraction(page: Page, fraction: number): Promise<void> {
  await page.evaluate((f) => window.scrollTo(0, Math.ceil(window.innerHeight * f)), fraction);
  await page.waitForTimeout(250);
}

export async function scrollToSelector(page: Page, selector: string): Promise<void> {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`no ${sel}`);
    const r = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
  }, selector);
  await page.waitForTimeout(400);
}

/** Videos that are actually playing per the media element, not just our state attribute. */
export async function playingVideos(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("video")].filter((v) => !v.paused && !v.ended && v.readyState > 1).map((v) => v.getAttribute("data-clip") ?? v.id),
  );
}

export async function waitForHeroPlaying(page: Page): Promise<void> {
  await expect(page.locator(".hero-video")).toHaveAttribute("data-state", "playing", { timeout: 15_000 });
  await expect
    .poll(async () => page.evaluate(() => (document.querySelector(".hero-video") as HTMLVideoElement).currentTime), { timeout: 15_000 })
    .toBeGreaterThan(0.05);
}

export async function heroProgress(page: Page): Promise<{ p: number; pe: number; state: string | null }> {
  return page.evaluate(() => {
    const hero = document.querySelector(".hero") as HTMLElement;
    return { p: Number(hero.style.getPropertyValue("--p") || 0), pe: Number(hero.style.getPropertyValue("--pe") || 0), state: hero.getAttribute("data-progress") };
  });
}
