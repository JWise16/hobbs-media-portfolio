import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ManifestEntry } from "@/clips/manifest.schema";
import {
  EncodeError,
  buildGraph,
  doubleBitrate,
  encode,
  encoderArgs,
  loadManifest,
  parseManifest,
  parseRational,
  probe,
  resolveSource,
  runProcess,
  validateAgainstProbe,
  type EncodeOptions,
} from "@/scripts/encode";
import { fixtures, tmpWorkspace, type Fixtures } from "../fixtures";

const fx: Fixtures = fixtures();

function baseEntry(over: Record<string, unknown> = {}) {
  return { id: "sunset", source: "landscape.mp4", in: 0, out: 2, loop: "none", focal: { x: 0.5, y: 0.4 }, ...over };
}
const manifestOf = (...entries: Array<Record<string, unknown>>) => ({ clips: entries });

async function expectCode(p: Promise<unknown> | (() => unknown), code: string): Promise<EncodeError> {
  try {
    await (typeof p === "function" ? p() : p);
  } catch (e) {
    expect(e).toBeInstanceOf(EncodeError);
    expect((e as EncodeError).code).toBe(code);
    return e as EncodeError;
  }
  throw new Error(`expected EncodeError ${code}`);
}

function workspace() {
  const root = tmpWorkspace();
  const manifestPath = path.join(root, "manifest.json");
  const outDir = path.join(root, "public/clips");
  const sidecarDir = path.join(root, "sidecars");
  const opts: EncodeOptions = {
    manifestPath,
    outDir,
    sidecarDir,
    previewDir: path.join(root, "preview"),
    indexPath: path.join(root, "content/clips.generated.ts"),
    sourceDir: fx.dir,
    preset: "ultrafast",
    log: () => {},
    siteStage: "review",
  };
  return { manifestPath, outDir, sidecarDir, opts, writeManifest: (m: unknown) => fs.writeFileSync(manifestPath, JSON.stringify(m)) };
}

describe("encode edges", () => {
  it("pure helpers: parseRational edges, doubleBitrate passthrough, absolute sources, encoderArgs, a missing binary, 16:9 on a portrait source, per-rung maxrate", () => {
    expect(parseRational("30")).toBe(30);
    expect(parseRational("0/1")).toBe(0);
    expect(parseRational("30/0")).toBe(0);
    expect(parseRational("abc")).toBe(0);
    expect(parseRational("-5/2")).toBe(0);
    expect(doubleBitrate("fast")).toBe("fast");
    expect(resolveSource({ source: "/abs/x.mp4" } as ManifestEntry, "/src")).toBe("/abs/x.mp4");
    expect(resolveSource({ source: "rel/x.mp4" } as ManifestEntry, "/src")).toBe("/src/rel/x.mp4");

    expect(encoderArgs({ label: "o720", rung: "720", width: 1280, height: 720, crf: 25, maxrate: "1.2M" }, "ultrafast")).toEqual([
      "-map", "[o720]", "-c:v", "libx264", "-preset", "ultrafast", "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p",
      "-crf", "25", "-maxrate", "1.2M", "-bufsize", "2.4M", "-an", "-movflags", "+faststart",
    ]);

    const r = runProcess("hobbs-no-such-binary-xyz", ["-version"]);
    expect(r.status).toBeNull();
    expect(r.stderr).toMatch(/ENOENT/);

    const portrait = probe(fx.portrait);
    const landscapeEntry = parseManifest(manifestOf(baseEntry({ source: "portrait.mp4", ratio: "16:9" }))).clips[0];
    expect(() => validateAgainstProbe(landscapeEntry, portrait)).toThrow(/RATIO_MISMATCH.*portrait.*Set ratio: "9:16"/s);

    const land = probe(fx.landscape);
    const g = buildGraph(parseManifest(manifestOf(baseEntry({ maxrate: { "720": "900k" } }))).clips[0], land);
    expect(g.outputs.map((o) => o.maxrate)).toEqual(["4M", "900k"]);
    const gv = buildGraph(parseManifest(manifestOf(baseEntry({ source: "portrait.mp4", ratio: "9:16", maxrate: { "720": "2M" } }))).clips[0], portrait);
    expect(gv.outputs.map((o) => o.maxrate)).toEqual(["2M"]);
  });

  it("probe: unparsable output, a failing ffprobe, no video stream, a zero frame rate, and the format-duration fallback", () => {
    const exec = (stdout: string, status = 0) => (() => ({ status, stdout, stderr: "bad input" })) as typeof runProcess;
    expect(() => probe("x.mp4", exec("not json"))).toThrow(/PROBE_FAILED.*unparsable/);
    expect(() => probe("x.mp4", exec("", 1))).toThrow(/PROBE_FAILED.*ffprobe failed on x\.mp4: bad input/);
    expect(() => probe("x.mp4", exec(JSON.stringify({ streams: [] })))).toThrow(/no usable video stream/);
    expect(() => probe("x.mp4", exec(JSON.stringify({ streams: [{ width: 10, height: 10, r_frame_rate: "30/1", duration: "0" }] })))).toThrow(/no usable video stream/);
    expect(() => probe("x.mp4", exec(JSON.stringify({ streams: [{ width: 10, height: 10, r_frame_rate: "0/0", duration: "2" }] })))).toThrow(/unusable frame rate "0\/0"/);
    const p = probe("x.mp4", exec(JSON.stringify({ streams: [{ width: 1920, height: 1080, r_frame_rate: "24/1" }], format: { duration: "3.5" } })));
    expect(p).toEqual({ duration: 3.5, width: 1920, height: 1080, fps: "24/1", fpsValue: 24 });
  });

  it("a manifest that is not JSON is MANIFEST_INVALID; a corrupt sidecar re-encodes; stray files survive pruning; a poster failure is a named ENCODE_FAILED", async () => {
    const ws = workspace();
    fs.writeFileSync(ws.manifestPath, "{ not json");
    const bad = await expectCode(loadManifest(ws.manifestPath), "MANIFEST_INVALID");
    expect(bad.message).toContain("is not valid JSON");

    ws.writeManifest(manifestOf(baseEntry({ id: "sunset" })));
    const s1 = await encode(ws.opts);
    fs.writeFileSync(path.join(ws.sidecarDir, `sunset.${s1.index.sunset.hash}.json`), "{ corrupt");
    fs.writeFileSync(path.join(ws.outDir, "README.txt"), "keep me");
    const s2 = await encode(ws.opts);
    expect(s2.encoded).toEqual(["sunset"]);
    expect(s2.pruned).toEqual([]);
    expect(fs.existsSync(path.join(ws.outDir, "README.txt"))).toBe(true);

    const failing: typeof runProcess = (cmd, args) => {
      if (cmd === "ffmpeg" && args.includes("-frames:v")) return { status: 1, stdout: "", stderr: "poster boom" };
      return runProcess(cmd, args);
    };
    const e = await expectCode(encode({ ...ws.opts, force: true, exec: failing }), "ENCODE_FAILED");
    expect(e.message).toMatch(/poster failed on clip "sunset"/);
    expect(e.message).toContain("poster boom");
    expect(fs.readdirSync(ws.outDir).filter((f) => f.startsWith(".tmp"))).toEqual([]);
    expect(fs.existsSync(path.join(ws.sidecarDir, ".encode.lock"))).toBe(false);
  });
});
