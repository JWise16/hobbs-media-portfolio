import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The two guard branches the real content cannot reach: over-limit strings
 * (design 17A) and a fully clean live build. runGuard imports content
 * dynamically, so each scenario mocks the modules it needs and re-imports.
 */

const MOCKED = ["@/content/agents", "@/content/properties", "@/content/work", "@/content/todo", "@/content/clips.generated", "@/clips/manifest.json"];

async function guardWith(mocks: Record<string, () => Record<string, unknown>>) {
  vi.resetModules();
  for (const [id, factory] of Object.entries(mocks)) vi.doMock(id, factory);
  const { runGuard } = await import("@/scripts/guard");
  return runGuard;
}

afterEach(() => {
  for (const id of MOCKED) vi.doUnmock(id);
  vi.resetModules();
});

describe("guard report branches", () => {
  it("over-limit names, titles and composed plaque lines fail at review and name every string; image work items and reel-less properties are skipped", async () => {
    const runGuard = await guardWith({
      "@/content/agents": () => ({
        agents: [{ slug: "long", displayName: "Alexandria Montgomery-Whitfield", brokerage: "Coldwell Banker Bain Seattle Eastside" }],
      }),
      "@/content/properties": () => ({
        properties: [{ slug: "orphan", title: "The Residences at Lakeshore Point", subtitle: "Film", agent: "nobody" }],
      }),
      "@/content/work": () => ({
        work: [
          { slug: "still", title: "Still", subtitle: "Photo", tag: "photography", media: { image: "/work/still.jpg", alt: "" } },
          { slug: "sound", title: "Sound", subtitle: "Film", tag: "drone", media: { clip: "placeholder-sound" } },
        ],
      }),
    });
    const r = await runGuard({ SITE_STAGE: "review" });
    expect(r.ok).toBe(false);
    expect(r.integrity).toEqual(['properties[orphan].agent "nobody" does not match any agent slug']);
    expect(r.limitViolations.map((v) => v.what)).toEqual(["agents[long].displayName", "agents[long].brokerage", "properties[orphan].title"]);
    expect(r.plaqueLimitViolations.map((v) => v.what)).toEqual(["/for/long plaque line 1", "/for/long plaque line 2", "/p/orphan plaque line 1"]);
    expect(r.unapprovedClips).toEqual(["placeholder-dusk", "placeholder-sound"]);
    const text = r.lines.join("\n");
    expect(text).toContain("Over-limit strings (design 17A):");
    expect(text).toContain('agents[long].displayName: "Alexandria Montgomery-Whitfield" is 31 characters (limit 24)');
    expect(text).toContain("FAIL: shorten the strings above.");
    expect(text).not.toContain("FAIL: SITE_STAGE=live");
    expect(text).not.toContain("OK for review");
  });

  it("live with nothing unconfirmed and every referenced clip approved passes, even under VERCEL_ENV=production", async () => {
    const runGuard = await guardWith({
      "@/content/todo": () => ({ todo: (_label: string, value: unknown) => value, todos: () => [], resetTodos: () => {} }),
      "@/content/clips.generated": () => {
        const ids = ["placeholder-dusk", "placeholder-harbor", "placeholder-rise", "placeholder-sound"];
        return { clips: Object.fromEntries(ids.map((id) => [id, { id, approved: true }])), clipIds: ids };
      },
      "@/clips/manifest.json": () => {
        const ids = ["placeholder-dusk", "placeholder-harbor", "placeholder-rise", "placeholder-sound"];
        return { default: { clips: ids.map((id) => ({ id, approved: true })) } };
      },
    });
    const r = await runGuard({ SITE_STAGE: "live", VERCEL_ENV: "production", SITE_URL: "https://hobbsmedia.co" });
    expect(r.ok).toBe(true);
    expect(r.stage).toBe("live");
    expect(r.todos).toEqual([]);
    expect(r.unapprovedClips).toEqual([]);
    expect(r.limitViolations).toEqual([]);
    const text = r.lines.join("\n");
    expect(text).toContain("Unconfirmed facts: none");
    expect(text).toContain("Unapproved clips referenced: none");
    expect(text).toContain("OK: nothing unconfirmed, every referenced clip approved.");
    expect(text).not.toContain("FAIL");
  });

  it("a generated index that disagrees with the manifest fails at every stage", async () => {
    const runGuard = await guardWith({
      "@/clips/manifest.json": () => ({
        default: {
          clips: [
            { id: "placeholder-dusk", approved: true },
            { id: "placeholder-harbor", approved: false },
            { id: "placeholder-rise", approved: false },
            { id: "brand-new", approved: false },
          ],
        },
      }),
    });
    const r = await runGuard({ SITE_STAGE: "review" });
    expect(r.ok).toBe(false);
    expect(r.integrity).toEqual([
      'clips.generated.ts has "placeholder-sound" but clips/manifest.json does not: run npm run encode',
      '"placeholder-dusk" approved=true in the manifest but false in the index: run npm run encode',
      'clips/manifest.json has "brand-new" but clips.generated.ts does not: run npm run encode',
    ]);
    expect(r.lines.join("\n")).toContain("FAIL: fix the content integrity problems above.");
  });
});
