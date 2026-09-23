import { expect, test } from "@playwright/test";
import { allThemes } from "./helpers";

test.describe("routes, metadata, caching", () => {
  test("/ redirects to /dark during review", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dark$/);
  });

  test("unknown agent, property, and theme are 404s, never redirects", async ({ page, request }) => {
    for (const path of ["/dark/for/nobody", "/dark/p/nowhere", "/neon", "/dark/about"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(404);
    }
    await page.goto("/dark/for/nobody");
    await expect(page.getByRole("heading", { name: "That link isn't live." })).toBeVisible();
    await expect(page.getByRole("link", { name: /text sam/i })).toHaveAttribute("href", /^sms:/);
    await expect(page.locator("main a.tracked[href='/dark']")).toHaveText(/hobbs media co\. home/i);
  });

  test("every route is noindex in review; robots.txt lets crawlers fetch pages so they can read it", async ({ page, request }) => {
    for (const path of ["/dark", "/hobbs", "/dark/for/jessica", "/dark/p/ocean-ave"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Allow:\s*\//);
    expect(robots).not.toMatch(/Disallow:\s*\/\s*$/m);
  });

  test("OG routes return image/png and pages point at them", async ({ page, request }) => {
    for (const theme of allThemes) {
      for (const path of [`/${theme}`, `/${theme}/for/jessica`, `/${theme}/p/ocean-ave`]) {
        const res = await request.get(`${path}/opengraph-image`);
        expect(res.status(), path).toBe(200);
        expect(res.headers()["content-type"]).toContain("image/png");
        expect((await res.body()).length).toBeGreaterThan(10_000);
      }
    }
    await page.goto("/dark/for/jessica");
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toMatch(/\/dark\/for\/jessica\/opengraph-image/);
    await expect(page).toHaveTitle(/For Jessica Tran/);
  });

  test("clip outputs are hashed and immutable", async ({ page, request }) => {
    await page.goto("/dark");
    const src = await page.locator(".hero-video").getAttribute("src");
    expect(src).toMatch(/^\/clips\/[a-z0-9-]+\.[0-9a-f]{8}\.(720|1080)\.mp4$/);
    const res = await request.head(src!);
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toContain("immutable");
  });

  test("contact links: sms:, mailto:, tel:, instagram", async ({ page }) => {
    await page.goto("/dark");
    const contact = page.locator("#contact");
    await expect(contact.getByRole("link", { name: /text sam/i })).toHaveAttribute("href", /^sms:\+1\d{10}$/);
    await expect(contact.getByRole("link", { name: /email sam/i })).toHaveAttribute("href", /^mailto:.+@.+/);
    await expect(contact.locator("a[href^='tel:']")).toHaveCount(1);
    await expect(contact.locator("a[href^='https://instagram.com/']")).toHaveCount(1);
  });

  test("calling card: personalized plaque with a tel: line, beat two reveals contact and one link to the work", async ({ page }) => {
    await page.goto("/dark/for/jessica");
    const plaque = page.locator(".hero-plaque");
    await expect(plaque).toContainText("PREPARED FOR JESSICA TRAN");
    await expect(plaque).toContainText("WINDERMERE");
    await expect(plaque.locator("a[href^='tel:']")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 2, name: "Jessica Tran · Windermere" })).toBeVisible();
    // One h1 per page: the wordmark in the hero.
    expect(await page.locator("h1").count()).toBe(1);
    await expect(page.getByRole("link", { name: /selected work/i })).toHaveAttribute("href", "/dark#work");
    // Property card names the property and the agent.
    await page.goto("/dark/p/ocean-ave");
    await expect(page.locator(".hero-plaque")).toContainText("1234 OCEAN AVE");
    await expect(page.locator(".hero-plaque")).toContainText("PREPARED FOR JESSICA TRAN");
  });

  test("plaque lines never wrap at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ["/dark", "/dark/for/jessica", "/dark/p/ocean-ave"]) {
      await page.goto(path);
      const heights = await page.locator(".hero-plaque .plaque-line").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
      expect(heights.length).toBe(3);
      for (const h of heights) expect(h).toBeLessThan(48);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    }
  });

  test("selected work renders every entry with title, tracked subtitle, short-form tag, and no approval chrome", async ({ page }) => {
    await page.goto("/dark");
    const frames = page.locator(".frame");
    expect(await frames.count()).toBe(8);
    await expect(frames.first().locator(".chip")).toHaveText("AERIAL");
    expect(await page.locator(".pending-tag").count()).toBe(0);
    await expect(frames.first().locator(".frame-title")).not.toBeEmpty();
  });

  test("stats row is omitted until all three are confirmed", async ({ page }) => {
    await page.goto("/dark");
    expect(await page.locator(".stats").count()).toBe(0);
  });

  test("cinematic themes have no kickers or numerals; hobbs has both", async ({ page }) => {
    await page.goto("/dark");
    expect(await page.locator(".kicker").count()).toBe(0);
    expect(await page.locator(".service-numeral").count()).toBe(0);
    await page.goto("/hobbs");
    expect(await page.locator("#what-i-do .kicker").count()).toBe(1);
    expect(await page.locator(".service-numeral").count()).toBe(3);
  });
});
