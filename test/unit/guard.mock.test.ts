import { afterEach, describe, expect, it, vi } from "vitest";
import { entryHash } from "@/scripts/encode";

/**
 * The guard branches the real content cannot reach: over-limit strings
 * (design 17A), duplicate slugs, a stale or malformed manifest, and a fully
 * clean live build. runGuard imports content dynamically, so each scenario
 * mocks the modules it needs and re-imports.
 */

const MOCKED = ["@/content/agents", "@/content/properties", "@/content/work", "@/content/todo", "@/content/clips.generated", "@/clips/manifest.json"];

type ManifestModule = { default: { clips: Array<Record<string, unknown>> } };

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

async function realIndex() {
  return vi.importActual<typeof import("@/content/clips.generated")>("@/content/clips.generated");
}
async function realManifest() {
  return vi.importActual<ManifestModule>("@/clips/manifest.json");
}

/** The real generated index and manifest with every clip approved. */
async function approvedEverything(except?: string): Promise<Record<string, () => Record<string, unknown>>> {
  const real = await realIndex();
  const manifest = await realManifest();
  const clips = Object.fromEntries(Object.entries(real.clips).map(([id, c]) => [id, { ...c, approved: id !== except }]));
  return {
    "@/content/clips.generated": () => ({ clips, clipIds: Object.keys(clips) }),
    "@/clips/manifest.json": () => ({ default: { clips: manifest.default.clips.map((c) => ({ ...c, approved: c.id !== except })) } }),
  };
}

const noTodos = () => ({ todo: (_label: string, value: unknown) => value, todos: () => [], resetTodos: () => {} });

describe("guard report branches", () => {
  it("over-limit names, titles and composed plaque lines fail at review and name every string; a dangling agent reference is an integrity error", async () => {
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
          { slug: "sound", title: "Sound", subtitle: "Film", tag: "drone", media: { clip: "tug-daylight" } },
        ],
      }),
    });
    const r = await runGuard({ SITE_STAGE: "review" });
    expect(r.ok).toBe(false);
    expect(r.integrity).toEqual(['properties[orphan].agent "nobody" does not match any agent slug']);
    expect(r.limitViolations.map((v) => v.what)).toEqual(["agents[long].displayName", "agents[long].brokerage", "properties[orphan].title"]);
    expect(r.plaqueLimitViolations.map((v) => v.what)).toEqual(["/for/long plaque line 1", "/for/long plaque line 2", "/p/orphan plaque line 1"]);
    expect(r.unapprovedClips).toEqual(["needle-above-clouds", "tug-daylight"]);
    const text = r.lines.join("\n");
    expect(text).toContain("Over-limit strings (design 17A):");
    expect(text).toContain('agents[long].displayName: "Alexandria Montgomery-Whitfield" is 31 characters (limit 24)');
    expect(text).toContain("FAIL: shorten the strings above.");
    expect(text).not.toContain("OK for review");
  });

  it("duplicate agent, property and work slugs are rejected", async () => {
    const runGuard = await guardWith({
      "@/content/agents": () => ({
        agents: [
          { slug: "jessica", displayName: "Jessica Tran", brokerage: "Windermere" },
          { slug: "jessica", displayName: "Jessica Other", brokerage: "Redfin" },
        ],
      }),
      "@/content/properties": () => ({
        properties: [
          { slug: "ocean-ave", title: "1234 Ocean Ave", subtitle: "Film", agent: "jessica" },
          { slug: "ocean-ave", title: "9 Ocean Ave", subtitle: "Film", agent: "jessica" },
        ],
      }),
      "@/content/work": () => ({
        work: [
          { slug: "a", title: "A", subtitle: "Film", tag: "drone", media: { clip: "sailboat-sunset" } },
          { slug: "a", title: "B", subtitle: "Film", tag: "drone", media: { clip: "spit-golden-hour" } },
        ],
      }),
    });
    const r = await runGuard({ SITE_STAGE: "review" });
    expect(r.integrity).toEqual([
      'agents: duplicate slug "jessica" (the first entry would win silently)',
      'properties: duplicate slug "ocean-ave" (the first entry would win silently)',
      'work: duplicate slug "a"',
    ]);
  });

  it("live with nothing unconfirmed, every clip approved, and SITE_URL set passes, even under VERCEL_ENV=production", async () => {
    const runGuard = await guardWith({ "@/content/todo": noTodos, ...(await approvedEverything()) });
    const r = await runGuard({ SITE_STAGE: "live", VERCEL_ENV: "production", SITE_URL: "https://hobbsmedia.co" });
    expect(r.integrity).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.stage).toBe("live");
    expect(r.todos).toEqual([]);
    expect(r.unapprovedClips).toEqual([]);
    const text = r.lines.join("\n");
    expect(text).toContain("Unconfirmed facts: none");
    expect(text).toContain("Unapproved clips referenced: none");
    expect(text).toContain("OK: nothing unconfirmed, every referenced clip approved.");
    expect(text).not.toContain("FAIL");
  });

  it("live refuses an unapproved clip that is still in the publication set even when nothing references it", async () => {
    const runGuard = await guardWith({
      "@/content/todo": noTodos,
      "@/content/work": () => ({ work: [{ slug: "dusk", title: "Dusk", subtitle: "Film", tag: "drone", media: { clip: "sailboat-sunset" } }] }),
      ...(await approvedEverything("tug-daylight")),
    });
    const r = await runGuard({ SITE_STAGE: "live", SITE_URL: "https://hobbsmedia.co" });
    expect(r.unapprovedClips).toEqual([]);
    expect(r.ok).toBe(false);
    expect(r.integrity).toEqual(['"tug-daylight" is unapproved but still in the publication set; remove it from the manifest and re-run npm run encode, or approve it']);
  });

  it("a generated index that disagrees with the manifest fails at every stage: ids, approval, and edited fields", async () => {
    const manifest = await realManifest();
    const edited = manifest.default.clips.map((c) => (c.id === "spit-golden-hour" ? { ...c, out: 12 } : c));
    const runGuard = await guardWith({
      "@/clips/manifest.json": () => ({
        default: {
          clips: [
            ...edited.filter((c) => c.id !== "tug-daylight").map((c) => (c.id === "sailboat-sunset" ? { ...c, approved: true } : c)),
            { ...manifest.default.clips[0], id: "brand-new" },
          ],
        },
      }),
    });
    const r = await runGuard({ SITE_STAGE: "review" });
    expect(r.ok).toBe(false);
    expect(r.integrity).toEqual([
      'clips.generated.ts has "tug-daylight" but clips/manifest.json does not: run npm run encode',
      '"sailboat-sunset" approved=true in the manifest but false in the index: run npm run encode',
      '"spit-golden-hour" was edited in the manifest after the last encode (in/out/speed/focal/loop/ratio/source): run npm run encode',
      'clips/manifest.json has "brand-new" but clips.generated.ts does not: run npm run encode',
    ]);
    expect(r.lines.join("\n")).toContain("FAIL: fix the content integrity problems above.");
  });

  it("a manifest that fails the strict schema (a quoted approval) is an integrity error, never a pass", async () => {
    const manifest = await realManifest();
    const at = manifest.default.clips.findIndex((c) => c.id === "sailboat-sunset");
    expect(at).toBeGreaterThanOrEqual(0);
    const runGuard = await guardWith({
      "@/clips/manifest.json": () => ({ default: { clips: manifest.default.clips.map((c) => (c.id === "sailboat-sunset" ? { ...c, approved: "false" } : c)) } }),
    });
    const r = await runGuard({ SITE_STAGE: "review" });
    expect(r.ok).toBe(false);
    expect(r.integrity.some((m) => m.startsWith(`clips/manifest.json clips.${at}.approved`))).toBe(true);
  });

  it("the guard and the encoder hash the manifest entry the same way", async () => {
    const manifest = await realManifest();
    const real = await realIndex();
    const { parseManifest } = await import("@/scripts/encode");
    const parsed = parseManifest(manifest.default);
    for (const entry of parsed.clips) expect(entryHash(entry)).toBe(real.clips[entry.id as keyof typeof real.clips].entryHash);
  });
});
