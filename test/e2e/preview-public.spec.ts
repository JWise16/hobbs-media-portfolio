import { expect, test } from "@playwright/test";

/**
 * T7/T8: runs logged out against a deployed preview (PREVIEW_URL). Vercel
 * Authentication must be off for previews, or these get a 401/redirect.
 */
test.describe("deployed preview is public", () => {
  test.skip(!process.env.PREVIEW_URL, "set PREVIEW_URL to run against a deployment");

  test("HTML for every theme link and a PNG from the OG route, no auth wall", async ({ request }) => {
    for (const path of ["/dark", "/light", "/twilight", "/hobbs", "/dark/for/jessica", "/dark/p/ocean-ave"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(200);
      expect(res.headers()["content-type"]).toContain("text/html");
      const html = await res.text();
      expect(html).toContain("Hobbs");
      expect(html).not.toContain("Vercel Authentication");
    }
    const og = await request.get("/dark/for/jessica/opengraph-image", { maxRedirects: 0 });
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
    const clip = await request.get("/dark");
    const src = (await clip.text()).match(/class="hero-video" src="([^"]+)"/)?.[1];
    expect(src).toBeTruthy();
    const mp4 = await request.head(src!);
    expect(mp4.status()).toBe(200);
    expect(mp4.headers()["cache-control"]).toContain("immutable");
    expect(mp4.headers()["accept-ranges"]).toBe("bytes");
  });
});
