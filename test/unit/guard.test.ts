import { describe, expect, it } from "vitest";
import { runGuard } from "@/scripts/guard";
import { resolveStage, StageError } from "@/lib/stage";
import { resetTodos, todo, todos } from "@/content/todo";

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

describe("todo() collector (6A)", () => {
  it("returns the value and registers the label once", () => {
    resetTodos();
    expect(todo("a", "x")).toBe("x");
    expect(todo("a", "y")).toBe("y");
    expect(todo("b", ["p", "q"])).toEqual(["p", "q"]);
    expect(todos()).toEqual([
      { label: "a", value: "x" },
      { label: "b", value: "p / q" },
    ]);
  });
});

describe("guard report (T6, T2, 17A)", () => {
  it("review: passes and lists every placeholder and unapproved clip", async () => {
    const r = await runGuard({ SITE_STAGE: "review" });
    expect(r.ok).toBe(true);
    expect(r.todos.length).toBeGreaterThan(10);
    expect(r.todos.map((t) => t.label)).toContain("contact.phone");
    expect(r.unapprovedClips).toContain("placeholder-dusk");
    expect(r.limitViolations).toEqual([]);
    expect(r.plaqueLimitViolations).toEqual([]);
    expect(r.lines.join("\n")).toContain("OK for review");
  });

  it("live: refuses while placeholders or unapproved clips remain, listing all of them at once", async () => {
    const r = await runGuard({ SITE_STAGE: "live" });
    expect(r.ok).toBe(false);
    const text = r.lines.join("\n");
    expect(text).toContain("FAIL: SITE_STAGE=live refuses");
    expect(text).toContain("contact.phone");
    expect(text).toContain("stats.homes");
    expect(text).toContain("placeholder-dusk");
  });

  it("typo fails before any report", async () => {
    await expect(runGuard({ SITE_STAGE: "prod" })).rejects.toThrow(StageError);
  });

  it("production without live fails", async () => {
    await expect(runGuard({ SITE_STAGE: "review", VERCEL_ENV: "production" })).rejects.toThrow(StageError);
  });
});
