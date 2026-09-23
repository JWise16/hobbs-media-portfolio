import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EncodeError,
  ENCODER_VERSION,
  buildGraph,
  contentHash,
  doubleBitrate,
  encode,
  outputNames,
  parseArgs,
  parseManifest,
  parseRational,
  preflight,
  probe,
  renderIndex,
  runProcess,
  stableStringify,
  validateAgainstProbe,
  type EncodeOptions,
} from "@/scripts/encode";
import { fixtures, makeFixtureClip, tmpWorkspace, type Fixtures } from "../fixtures";

// Fixtures are built at collection time: describe blocks probe them directly.
const fx: Fixtures = fixtures();

function baseEntry(over: Record<string, unknown> = {}) {
  return {
    id: "sunset",
    source: "landscape.mp4",
    in: 0,
    out: 2,
    loop: "none",
    focal: { x: 0.5, y: 0.4 },
    ...over,
  };
}

function manifestOf(...entries: Array<Record<string, unknown>>) {
  return { clips: entries };
}

async function expectCode(p: Promise<unknown> | (() => unknown), code: string) {
  try {
    await (typeof p === "function" ? p() : p);
  } catch (e) {
    expect(e).toBeInstanceOf(EncodeError);
    expect((e as EncodeError).code).toBe(code);
    return e as EncodeError;
  }
  throw new Error(`expected EncodeError ${code}`);
}

interface Workspace {
  root: string;
  manifestPath: string;
  outDir: string;
  sidecarDir: string;
  previewDir: string;
  indexPath: string;
  opts: EncodeOptions;
  calls: { ffmpeg: number };
  writeManifest: (m: unknown) => void;
}

function workspace(): Workspace {
  const root = tmpWorkspace();
  const manifestPath = path.join(root, "manifest.json");
  const outDir = path.join(root, "public/clips");
  const sidecarDir = path.join(root, "sidecars");
  const previewDir = path.join(root, "preview");
  const indexPath = path.join(root, "content/clips.generated.ts");
  const calls = { ffmpeg: 0 };
  const exec: typeof runProcess = (cmd, args) => {
    if (cmd === "ffmpeg" && !args.includes("-version")) calls.ffmpeg++;
    return runProcess(cmd, args);
  };
  const opts: EncodeOptions = {
    manifestPath,
    outDir,
    sidecarDir,
    previewDir,
    indexPath,
    sourceDir: fx.dir,
    preset: "ultrafast",
    log: () => {},
    exec,
    siteStage: "review",
  };
  return {
    root,
    manifestPath,
    outDir,
    sidecarDir,
    previewDir,
    indexPath,
    opts,
    calls,
    writeManifest: (m) => fs.writeFileSync(manifestPath, JSON.stringify(m)),
  };
}

describe("manifest validation (zod)", () => {
  it("accepts a minimal entry and applies defaults", () => {
    const m = parseManifest(manifestOf(baseEntry()));
    expect(m.clips[0]).toMatchObject({ speed: 1, ratio: "16:9", approved: false, hero: false });
  });

  it("rejects in >= out", () => {
    expect(() => parseManifest(manifestOf(baseEntry({ in: 2, out: 2 })))).toThrow(/out \(2\) must be greater than in/);
  });

  it("rejects speed <= 0", () => {
    expect(() => parseManifest(manifestOf(baseEntry({ speed: 0 })))).toThrow(/speed/);
  });

  it("rejects focal outside 0..1", () => {
    expect(() => parseManifest(manifestOf(baseEntry({ focal: { x: 1.2, y: 0 } })))).toThrow(/focal/);
  });

  it("rejects an unknown loop mode", () => {
    expect(() => parseManifest(manifestOf(baseEntry({ loop: "bounce" })))).toThrow(/loop/);
  });

  it("rejects duplicate ids and names them", () => {
    expect(() => parseManifest(manifestOf(baseEntry(), baseEntry()))).toThrow(/duplicate clip id "sunset"/);
  });

  it("requires focal for hero clips", () => {
    expect(() => parseManifest(manifestOf(baseEntry({ hero: true, focal: undefined })))).toThrow(/focal is required for hero clip "sunset"/);
  });

  it("rejects unknown keys so typos surface", () => {
    expect(() => parseManifest(manifestOf(baseEntry({ lop: "xfade" })))).toThrow(/MANIFEST_INVALID/);
  });

  it("rejects a bad id shape", () => {
    expect(() => parseManifest(manifestOf(baseEntry({ id: "Sunset Clip" })))).toThrow(/kebab-case/);
  });

  it("throws a named EncodeError", async () => {
    const e = await expectCode(() => parseManifest({}), "MANIFEST_INVALID");
    expect(e.message).toContain("clips");
  });
});

describe("preflight", () => {
  it("names the Homebrew install line when ffmpeg is missing", async () => {
    const e = await expectCode(() => preflight(() => ({ status: null, stdout: "", stderr: "ENOENT" })), "FFMPEG_MISSING");
    expect(e.message).toContain("brew install ffmpeg");
  });

  it("passes on this machine", () => {
    expect(() => preflight()).not.toThrow();
  });
});

describe("probe", () => {
  it("reads duration, size and fps from the fixture", () => {
    const p = probe(fx.landscape);
    expect(p.width).toBe(1280);
    expect(p.height).toBe(720);
    expect(p.duration).toBeCloseTo(2, 1);
    expect(p.fpsValue).toBeCloseTo(30, 3);
  });

  it("halves frame rates above 40", () => {
    expect(parseRational("60000/1001")).toBeCloseTo(59.94, 2);
    const dir = tmpWorkspace();
    const file = path.join(dir, "sixty.mp4");
    makeFixtureClip(file, 320, 180, 1, 60);
    const p = probe(file);
    expect(p.fpsValue).toBeCloseTo(30, 3);
    expect(p.fps).toBe("60/2");
  });

  it("fails with PROBE_FAILED on a non-video file", async () => {
    const dir = tmpWorkspace();
    const file = path.join(dir, "not-a-video.mp4");
    fs.writeFileSync(file, "hello");
    await expectCode(() => probe(file), "PROBE_FAILED");
  });
});

describe("validateAgainstProbe", () => {
  const p = probe(fx.landscape);

  it("rejects out past the source end", async () => {
    const entry = parseManifest(manifestOf(baseEntry({ out: 3 }))).clips[0];
    const e = await expectCode(() => validateAgainstProbe(entry, p), "RANGE_INVALID");
    expect(e.message).toContain("out=3s");
  });

  it("rejects a 9:16 ratio on a landscape source", async () => {
    const entry = parseManifest(manifestOf(baseEntry({ ratio: "9:16" }))).clips[0];
    await expectCode(() => validateAgainstProbe(entry, p), "RATIO_MISMATCH");
  });

  it("rejects xfade when the loop would be shorter than 2 s", async () => {
    const entry = parseManifest(manifestOf(baseEntry({ loop: "xfade", out: 1.5 }))).clips[0];
    await expectCode(() => validateAgainstProbe(entry, p), "LOOP_TOO_SHORT");
  });
});

describe("hashing", () => {
  it("stableStringify ignores key order", () => {
    expect(stableStringify({ b: 1, a: [{ d: 2, c: 3 }] })).toBe(stableStringify({ a: [{ c: 3, d: 2 }], b: 1 }));
  });

  it("changes when in/out, speed, focal, loop, or encoder version change; not when approved flips", () => {
    const e = parseManifest(manifestOf(baseEntry())).clips[0];
    const h = contentHash("src", e, "medium");
    expect(h).toMatch(/^[0-9a-f]{8}$/);
    expect(contentHash("src", { ...e, out: 1.5 }, "medium")).not.toBe(h);
    expect(contentHash("src", { ...e, speed: 2 }, "medium")).not.toBe(h);
    expect(contentHash("src", { ...e, focal: { x: 0.1, y: 0.1 } }, "medium")).not.toBe(h);
    expect(contentHash("src", { ...e, loop: "xfade" }, "medium")).not.toBe(h);
    expect(contentHash("other", e, "medium")).not.toBe(h);
    expect(contentHash("src", e, "slow")).not.toBe(h);
    expect(contentHash("src", { ...e, approved: true }, "medium")).toBe(h);
    expect(ENCODER_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
  });
});

describe("buildGraph", () => {
  const p = probe(fx.landscape);

  it("none: cover-crops to 1080 and splits a 720 rung", () => {
    const g = buildGraph(parseManifest(manifestOf(baseEntry())).clips[0], p);
    expect(g.inputArgs).toEqual(["-ss", "0", "-t", "2"]);
    expect(g.filterComplex).toContain("scale=1920:1080:force_original_aspect_ratio=increase");
    expect(g.filterComplex).toContain("crop=1280:720");
    expect(g.outputs.map((o) => o.rung)).toEqual(["1080", "720"]);
    expect(g.duration).toBeCloseTo(2, 3);
  });

  it("xfade: body first, blend appended, loop 0.5 s shorter", () => {
    const g = buildGraph(parseManifest(manifestOf(baseEntry({ loop: "xfade" }))).clips[0], p);
    expect(g.filterComplex).toContain("trim=start=0.5:end=1.5,setpts=PTS-STARTPTS[body]");
    expect(g.filterComplex).toContain("xfade=transition=fade:duration=0.5:offset=0[blend]");
    expect(g.filterComplex).toContain("[body][blend]concat");
    expect(g.duration).toBeCloseTo(1.5, 3);
  });

  it("pingpong: forward then reverse without duplicated seam frames", () => {
    const g = buildGraph(parseManifest(manifestOf(baseEntry({ loop: "pingpong" }))).clips[0], p);
    expect(g.filterComplex).toContain("reverse,trim=start_frame=1:end_frame=59");
    expect(g.duration).toBeCloseTo((2 * 60 - 2) / 30, 3);
  });

  it("speed divides pts and is part of the input window", () => {
    const g = buildGraph(parseManifest(manifestOf(baseEntry({ speed: 2, in: 0.5, out: 2 }))).clips[0], p);
    expect(g.inputArgs).toEqual(["-ss", "0.5", "-t", "1.5"]);
    expect(g.filterComplex).toContain("setpts=(PTS-STARTPTS)/2");
    expect(g.duration).toBeCloseTo(0.75, 3);
  });

  it("9:16: a single vertical rung, no crop to 16:9", () => {
    const pp = probe(fx.portrait);
    const g = buildGraph(parseManifest(manifestOf(baseEntry({ source: "portrait.mp4", ratio: "9:16" }))).clips[0], pp);
    expect(g.outputs).toHaveLength(1);
    expect(g.outputs[0]).toMatchObject({ rung: "720", width: 720, height: 1280 });
    expect(g.filterComplex).toContain("scale=720:1280");
    expect(g.filterComplex).not.toContain("1920");
  });

  it("maxrate override applies per rung; bufsize doubles it", () => {
    const g = buildGraph(parseManifest(manifestOf(baseEntry({ maxrate: { "1080": "6M" } }))).clips[0], p);
    expect(g.outputs[0].maxrate).toBe("6M");
    expect(g.outputs[1].maxrate).toBe("1.2M");
    expect(doubleBitrate("6M")).toBe("12M");
    expect(doubleBitrate("1.2M")).toBe("2.4M");
    expect(doubleBitrate("1200k")).toBe("2400k");
  });
});

describe("outputNames", () => {
  it("hashes every output and drops the 1080 set for 9:16", () => {
    const n = outputNames("sunset", "deadbeef", "16:9");
    expect(n.mp4_1080).toBe("sunset.deadbeef.1080.mp4");
    expect(n.mp4_720).toBe("sunset.deadbeef.720.mp4");
    expect(n.poster).toBe("sunset.deadbeef.jpg");
    expect(n.poster_1920).toBe("sunset.deadbeef.poster.1920.jpg");
    expect(n.preview_916).toBe("sunset.deadbeef.preview-916.jpg");
    expect(n.sidecar).toBe("sunset.deadbeef.json");
    const v = outputNames("tower", "deadbeef", "9:16");
    expect(v.mp4_1080).toBeUndefined();
    expect(v.poster_1920).toBeUndefined();
    expect(v.preview_916).toBeUndefined();
  });
});

describe("renderIndex", () => {
  it("emits a typed, generated module", () => {
    const src = renderIndex([
      {
        id: "sunset",
        hash: "deadbeef",
        entryHash: "cafef00d",
        ratio: "16:9",
        focal: { x: 0.5, y: 0.5 },
        loop: "none",
        duration: 2,
        approved: false,
        hero: true,
        files: { mp4_720: "/clips/sunset.deadbeef.720.mp4", poster: "/clips/sunset.deadbeef.jpg" },
      },
    ]);
    expect(src).toContain("GENERATED");
    expect(src).toContain('import type { ClipEntry } from "@/lib/clips.types"');
    expect(src).toContain('"sunset": {');
    expect(src).toContain("satisfies Record<string, ClipEntry>");
    expect(src).toContain("export type ClipId = keyof typeof clips");
  });
});

describe("encode (real ffmpeg on the 2 s fixture)", () => {
  it("fails with SOURCE_MISSING before touching the disk", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry({ source: "nope.mp4" })));
    const e = await expectCode(encode(ws.opts), "SOURCE_MISSING");
    expect(e.message).toContain("nope.mp4");
    expect(fs.existsSync(ws.outDir)).toBe(false);
  });

  it("fails with MANIFEST_MISSING when there is no manifest", async () => {
    const ws = workspace();
    await expectCode(encode(ws.opts), "MANIFEST_MISSING");
  });

  it("refuses unapproved clips when SITE_STAGE=live and lists them", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry(), baseEntry({ id: "harbor", approved: true })));
    const e = await expectCode(encode({ ...ws.opts, siteStage: "live" }), "UNAPPROVED_LIVE");
    expect(e.message).toContain("sunset");
    expect(e.message).not.toContain("harbor");
  });

  it("dry-run validates and writes nothing", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry()));
    const s = await encode({ ...ws.opts, dryRun: true });
    expect(s.encoded).toEqual([]);
    expect(fs.existsSync(ws.outDir)).toBe(false);
    expect(fs.existsSync(ws.indexPath)).toBe(false);
  });

  it("encodes all three loop modes, writes hashed outputs, sidecars, preview and index; rerun is a no-op", async () => {
    const ws = workspace();
    ws.writeManifest(
      manifestOf(
        baseEntry({ id: "sunset", loop: "xfade", hero: true, focal: { x: 0.8, y: 0.5 } }),
        baseEntry({ id: "rise", loop: "pingpong" }),
        baseEntry({ id: "still", loop: "none", approved: true }),
      ),
    );
    const s = await encode(ws.opts);
    expect(s.encoded.sort()).toEqual(["rise", "still", "sunset"]);
    expect(s.skipped).toEqual([]);

    const files = fs.readdirSync(ws.outDir).sort();
    for (const id of ["sunset", "rise", "still"]) {
      const entry = s.index[id];
      expect(entry.hash).toMatch(/^[0-9a-f]{8}$/);
      const base = `${id}.${entry.hash}`;
      expect(files).toContain(`${base}.1080.mp4`);
      expect(files).toContain(`${base}.720.mp4`);
      expect(files).toContain(`${base}.jpg`);
      expect(files).toContain(`${base}.poster.1920.jpg`);
      // sidecars carry the source path and never sit under public/
      expect(files).not.toContain(`${base}.json`);
      expect(fs.existsSync(path.join(ws.sidecarDir, `${base}.json`))).toBe(true);
      expect(entry.files.mp4_720).toBe(`/clips/${base}.720.mp4`);
      expect(entry.files.mp4_1080).toBe(`/clips/${base}.1080.mp4`);
      expect(entry.files.poster).toBe(`/clips/${base}.jpg`);
      expect(entry.files.poster_1920).toBe(`/clips/${base}.poster.1920.jpg`);
      // review-only 9:16 preview lands outside public/
      expect(fs.existsSync(path.join(ws.previewDir, `${base}.preview-916.jpg`))).toBe(true);
    }
    // no temp dir or lock left behind
    expect(fs.readdirSync(ws.outDir).filter((f) => f.startsWith("."))).toEqual([]);
    expect(fs.readdirSync(ws.sidecarDir).filter((f) => f.startsWith("."))).toEqual([]);

    // rung sizes and poster widths
    const sunset = s.index.sunset;
    const p1080 = probe(path.join(ws.outDir, path.basename(sunset.files.mp4_1080!)));
    expect([p1080.width, p1080.height]).toEqual([1920, 1080]);
    const p720 = probe(path.join(ws.outDir, path.basename(sunset.files.mp4_720)));
    expect([p720.width, p720.height]).toEqual([1280, 720]);
    const poster = probe(path.join(ws.outDir, path.basename(sunset.files.poster)));
    expect(poster.width).toBe(720);
    const poster1920 = probe(path.join(ws.outDir, path.basename(sunset.files.poster_1920!)));
    expect(poster1920.width).toBe(1920);
    const preview = probe(path.join(ws.previewDir, `sunset.${sunset.hash}.preview-916.jpg`));
    expect([preview.width, preview.height]).toEqual([608, 1080]);

    // durations follow the loop mode
    expect(sunset.duration).toBeCloseTo(1.5, 1);
    expect(s.index.rise.duration).toBeCloseTo((2 * 60 - 2) / 30, 1);
    expect(s.index.still.duration).toBeCloseTo(2, 1);
    expect(sunset.hero).toBe(true);
    expect(sunset.focal).toEqual({ x: 0.8, y: 0.5 });
    expect(s.index.still.approved).toBe(true);
    expect(s.index.rise.approved).toBe(false);

    // generated index is the typed module
    const index = fs.readFileSync(ws.indexPath, "utf8");
    expect(index).toContain(`"sunset": {`);
    expect(index).toContain(`"hash": "${sunset.hash}"`);
    expect(sunset.entryHash).toMatch(/^[0-9a-f]{8}$/);
    expect(s.index.rise.entryHash).not.toBe(sunset.entryHash);

    // rerun: nothing re-encoded
    const before = ws.calls.ffmpeg;
    const s2 = await encode(ws.opts);
    expect(s2.encoded).toEqual([]);
    expect(s2.skipped.sort()).toEqual(["rise", "still", "sunset"]);
    expect(ws.calls.ffmpeg).toBe(before);
    expect(s2.pruned).toEqual([]);

    // flipping approved does not re-encode but updates the index
    ws.writeManifest(
      manifestOf(
        baseEntry({ id: "sunset", loop: "xfade", hero: true, focal: { x: 0.8, y: 0.5 }, approved: true }),
        baseEntry({ id: "rise", loop: "pingpong" }),
        baseEntry({ id: "still", loop: "none", approved: true }),
      ),
    );
    const s3 = await encode(ws.opts);
    expect(s3.encoded).toEqual([]);
    expect(s3.index.sunset.approved).toBe(true);
    expect(s3.index.sunset.hash).toBe(sunset.hash);
  });

  it("re-encodes on a content change with a new hash and prunes the stale set", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry({ id: "sunset" })));
    const s1 = await encode(ws.opts);
    const oldHash = s1.index.sunset.hash;

    ws.writeManifest(manifestOf(baseEntry({ id: "sunset", out: 1.5 })));
    const s2 = await encode(ws.opts);
    expect(s2.encoded).toEqual(["sunset"]);
    expect(s2.index.sunset.hash).not.toBe(oldHash);
    // 1080, 720, poster, poster.1920 in public/clips, the sidecar, and the preview-916
    expect(s2.pruned.filter((f) => f.includes(oldHash)).length).toBe(6);
    const left = fs.readdirSync(ws.outDir).filter((f) => f.includes(oldHash));
    expect(left).toEqual([]);
    expect(fs.readdirSync(ws.sidecarDir).filter((f) => f.includes(oldHash))).toEqual([]);
    expect(fs.readdirSync(ws.previewDir).filter((f) => f.includes(oldHash))).toEqual([]);
  });

  it("removes outputs for clips dropped from the manifest", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry({ id: "sunset" }), baseEntry({ id: "harbor" })));
    await encode(ws.opts);
    ws.writeManifest(manifestOf(baseEntry({ id: "sunset" })));
    const s = await encode(ws.opts);
    expect(s.skipped).toEqual(["sunset"]);
    expect(fs.readdirSync(ws.outDir).some((f) => f.startsWith("harbor."))).toBe(false);
    expect(Object.keys(s.index)).toEqual(["sunset"]);
  });

  it("re-encodes when an output file is missing even if the sidecar matches", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry({ id: "sunset" })));
    const s1 = await encode(ws.opts);
    fs.rmSync(path.join(ws.outDir, path.basename(s1.index.sunset.files.mp4_720)));
    const s2 = await encode(ws.opts);
    expect(s2.encoded).toEqual(["sunset"]);
  });

  it("--force re-encodes everything", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry({ id: "sunset" })));
    await encode(ws.opts);
    const s = await encode({ ...ws.opts, force: true });
    expect(s.encoded).toEqual(["sunset"]);
  });

  it("native 9:16 source: single rung, 720 wide poster, no 1080 set, no preview", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry({ id: "tower", source: "portrait.mp4", ratio: "9:16" })));
    const s = await encode(ws.opts);
    const t = s.index.tower;
    expect(t.files.mp4_1080).toBeUndefined();
    expect(t.files.poster_1920).toBeUndefined();
    const v = probe(path.join(ws.outDir, path.basename(t.files.mp4_720)));
    expect([v.width, v.height]).toEqual([720, 1280]);
    const poster = probe(path.join(ws.outDir, path.basename(t.files.poster)));
    expect([poster.width, poster.height]).toEqual([720, 1280]);
    expect(fs.existsSync(ws.previewDir)).toBe(false);
    expect(fs.readdirSync(ws.outDir).filter((f) => f.endsWith(".mp4"))).toHaveLength(1);
  });

  it("leaves no partial file when ffmpeg fails mid-run", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry({ id: "sunset" })));
    const failing: typeof runProcess = (cmd, args) => {
      if (cmd === "ffmpeg" && args.includes("-filter_complex")) {
        // simulate a crash after a partial write
        const out = args[args.length - 1];
        fs.writeFileSync(out, "partial");
        return { status: 1, stdout: "", stderr: "simulated crash" };
      }
      return runProcess(cmd, args);
    };
    const e = await expectCode(encode({ ...ws.opts, exec: failing }), "ENCODE_FAILED");
    expect(e.message).toContain("simulated crash");
    expect(fs.readdirSync(ws.outDir)).toEqual([]);
    expect(fs.readdirSync(ws.sidecarDir)).toEqual([]);
    expect(fs.existsSync(ws.indexPath)).toBe(false);
  });
});

describe("encode: locking, sidecar trust, CLI args", () => {
  it("refuses to run while another encode holds the lock, and clears it afterwards", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry({ id: "sunset" })));
    fs.mkdirSync(ws.sidecarDir, { recursive: true });
    fs.writeFileSync(path.join(ws.sidecarDir, ".encode.lock"), "999999\n");
    const e = await expectCode(encode(ws.opts), "LOCKED");
    expect(e.message).toContain(".encode.lock");
    fs.rmSync(path.join(ws.sidecarDir, ".encode.lock"));
    await encode(ws.opts);
    expect(fs.existsSync(path.join(ws.sidecarDir, ".encode.lock"))).toBe(false);
  });

  it("ignores a sidecar that names another clip's files or fails the schema", async () => {
    const ws = workspace();
    ws.writeManifest(manifestOf(baseEntry({ id: "sunset" })));
    const s1 = await encode(ws.opts);
    const sidecarPath = path.join(ws.sidecarDir, `sunset.${s1.index.sunset.hash}.json`);
    const good = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));
    // Same shape, wrong files: must re-encode rather than trust it.
    fs.writeFileSync(sidecarPath, JSON.stringify({ ...good, files: { ...good.files, mp4_720: "/clips/other.deadbeef.720.mp4" } }));
    const s2 = await encode(ws.opts);
    expect(s2.encoded).toEqual(["sunset"]);
    // Missing duration: schema rejects, re-encode.
    const again = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));
    delete again.duration;
    fs.writeFileSync(sidecarPath, JSON.stringify(again));
    const s3 = await encode(ws.opts);
    expect(s3.encoded).toEqual(["sunset"]);
    // Untouched: skipped.
    const s4 = await encode(ws.opts);
    expect(s4.skipped).toEqual(["sunset"]);
    expect(JSON.parse(fs.readFileSync(sidecarPath, "utf8")).sourceHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("parses CLI flags and rejects a trailing or unknown flag with a usage error", () => {
    expect(parseArgs(["--force", "--dry-run", "--preset", "slow", "--manifest", "m.json", "--out", "o"])).toMatchObject({
      force: true,
      dryRun: true,
      preset: "slow",
      manifestPath: path.resolve("m.json"),
      outDir: path.resolve("o"),
    });
    expect(parseArgs([])).toEqual({});
    expect(() => parseArgs(["--manifest"])).toThrow();
    expect(() => parseArgs(["--bogus"])).toThrow();
  });
});
