import { describe, expect, it } from "vitest";
import { runGuard } from "@/scripts/guard";
import { resolveStage, StageError } from "@/lib/stage";

describe("SITE_STAGE (T1, fails closed)", () => {
  it("accepts exactly review or live", () => {
    expect(resolveStage({ SITE_STAGE: "review" })).toBe("review");
    expect(resolveStage({ SITE_STAGE: "live" })).toBe("live");
  });
  it("rejects a typo, casing, whitespace, and nothing", () => {
    for (const bad of ["prod", "Review", "live ", "", undefined]) {
      expect(() => resolveStage({ SITE_STAGE: bad })).toThrow(StageError);
    }
  });
  it("production requires live", () => {
    expect(() => resolveStage({ SITE_STAGE: "review", VERCEL_ENV: "production" })).toThrow(/VERCEL_ENV=production requires SITE_STAGE=live/);
    expect(resolveStage({ SITE_STAGE: "live", VERCEL_ENV: "production" })).toBe("live");
    expect(resolveStage({ SITE_STAGE: "review", VERCEL_ENV: "preview" })).toBe("review");
  });
});

describe("guard report (T6, T2, 17A)", () => {
  it("review: passes and lists every placeholder and unapproved clip", async () => {
    const r = await runGuard({ SITE_STAGE: "review" });
    expect(r.ok).toBe(true);
    expect(r.todos.length).toBeGreaterThan(0);
    expect(r.todos.map((t) => t.label)).toContain("agents.jessica.displayName");
    expect(r.unapprovedClips).toEqual([]);
    expect(r.limitViolations).toEqual([]);
    expect(r.plaqueLimitViolations).toEqual([]);
    expect(r.lines.join("\n")).toContain("OK for review");
  });

  it("live: refuses while placeholders or unapproved clips remain, listing all of them at once", async () => {
    const r = await runGuard({ SITE_STAGE: "live" });
    expect(r.ok).toBe(false);
    const text = r.lines.join("\n");
    expect(text).toContain("FAIL: SITE_STAGE=live refuses");
    // The sample cards were loaded under review in this process; at a real live build they are absent.
    expect(text).toContain("agents.jessica.displayName");
    expect(text).toContain("Unconfirmed facts (");
  });

  it("live also requires an absolute SITE_URL for og:image links", async () => {
    const without = await runGuard({ SITE_STAGE: "live" });
    expect(without.launch.join(" ")).toContain("SITE_URL must be an absolute https URL");
    const bad = await runGuard({ SITE_STAGE: "live", SITE_URL: "hobbsmedia.co" });
    expect(bad.launch).toHaveLength(1);
    expect(bad.lines.join("\n")).toContain("Launch requirements:");
    const http = await runGuard({ SITE_STAGE: "live", SITE_URL: "http://hobbsmedia.co" });
    expect(http.launch).toHaveLength(1);
    const good = await runGuard({ SITE_STAGE: "live", SITE_URL: "https://hobbsmedia.co/" });
    expect(good.launch).toEqual([]);
    expect(good.lines.join("\n")).not.toContain("Launch requirements:");
  });

  it("review: the manifest, the generated index, the files on disk, and the agent references agree", async () => {
    const r = await runGuard({ SITE_STAGE: "review" });
    expect(r.integrity).toEqual([]);
  });

  it("files named by the index must exist and be non-empty under public/", async () => {
    const r = await runGuard({ SITE_STAGE: "review" }, { cwd: "/nonexistent-root" });
    expect(r.ok).toBe(false);
    expect(r.integrity.some((m) => m.includes("missing from public/"))).toBe(true);
  });

  it("typo fails before any report", async () => {
    await expect(runGuard({ SITE_STAGE: "prod" })).rejects.toThrow(StageError);
  });

  it("production without live fails", async () => {
    await expect(runGuard({ SITE_STAGE: "review", VERCEL_ENV: "production" })).rejects.toThrow(StageError);
  });
});
