/**
 * Footage pipeline: clips/manifest.json → public/clips/<id>.<hash8>.{1080,720}.mp4,
 * <id>.<hash8>.jpg, <id>.<hash8>.poster.1920.jpg, a sidecar <id>.<hash8>.json,
 * a review-only clips/preview/<id>.<hash8>.preview-916.jpg, and the typed index
 * content/clips.generated.ts.
 *
 *   npm run encode                 # encode what changed, prune stale, write index
 *   npm run encode -- --force      # ignore sidecars, re-encode everything
 *   npm run encode -- --dry-run    # validate, probe, report; write nothing
 *
 * Design: docs/designs/hobbs-media-portfolio.md ("Footage pipeline", eng 4A, 8A, T2; design 15A).
 * Every failure is an EncodeError with a stable `code` so tests and humans can
 * tell them apart. Outputs are written to public/clips/.tmp then renamed, so an
 * interrupted run never leaves a partial file behind.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs as nodeParseArgs } from "node:util";
import { z } from "zod";
import { clipEntryBaseSchema, manifestSchema, type Manifest, type ManifestEntry } from "../clips/manifest.schema";
import type { ClipEntry, ClipFiles } from "../lib/clips.types";
import { loadDotEnv } from "./env";
import { isMain } from "./isMain";

// ── Errors ────────────────────────────────────────────────────────────────────

export type EncodeErrorCode =
  | "FFMPEG_MISSING"
  | "MANIFEST_MISSING"
  | "MANIFEST_INVALID"
  | "SOURCE_MISSING"
  | "PROBE_FAILED"
  | "RANGE_INVALID"
  | "RATIO_MISMATCH"
  | "LOOP_TOO_SHORT"
  | "UNAPPROVED_LIVE"
  | "LOCKED"
  | "ENCODE_FAILED";

export class EncodeError extends Error {
  readonly code: EncodeErrorCode;
  constructor(code: EncodeErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "EncodeError";
    this.code = code;
  }
}

// ── Settings ──────────────────────────────────────────────────────────────────

/**
 * Bump ENCODER_VERSION whenever the ffmpeg arguments change in a way that
 * should re-encode every clip. It is part of the content hash.
 */
export const ENCODER_VERSION = "2026-09-22.1";

export const XFADE_SECONDS = 0.5;

export const RUNGS = {
  "1080": { width: 1920, height: 1080, crf: 23, maxrate: "4M" },
  "720": { width: 1280, height: 720, crf: 25, maxrate: "1.2M" },
} as const;

export const VERTICAL_RUNG = { width: 720, height: 1280, crf: 25, maxrate: "1.2M" } as const;

export interface EncodeOptions {
  manifestPath?: string;
  outDir?: string;
  /** Sidecars record the source path and hash; they live outside public/ so they are never served. */
  sidecarDir?: string;
  previewDir?: string;
  indexPath?: string;
  sourceDir?: string;
  /** x264 preset. Tests use "ultrafast". */
  preset?: string;
  force?: boolean;
  dryRun?: boolean;
  /** Read at call time so tests can set it. */
  siteStage?: string;
  log?: (line: string) => void;
  /** Overridable for tests that count invocations. */
  exec?: typeof runProcess;
}

export interface EncodeSummary {
  encoded: string[];
  skipped: string[];
  pruned: string[];
  index: Record<string, ClipEntry>;
}

interface ResolvedOptions extends Required<Omit<EncodeOptions, "siteStage">> {
  siteStage: string | undefined;
}

function resolveOptions(opts: EncodeOptions): ResolvedOptions {
  const cwd = process.cwd();
  return {
    manifestPath: opts.manifestPath ?? path.join(cwd, "clips/manifest.json"),
    outDir: opts.outDir ?? path.join(cwd, "public/clips"),
    sidecarDir: opts.sidecarDir ?? path.join(cwd, "clips/sidecars"),
    previewDir: opts.previewDir ?? path.join(cwd, "clips/preview"),
    indexPath: opts.indexPath ?? path.join(cwd, "content/clips.generated.ts"),
    sourceDir: opts.sourceDir ?? process.env.CLIPS_SOURCE_DIR ?? path.join(cwd, "clips/source"),
    preset: opts.preset ?? process.env.ENCODE_PRESET ?? "medium",
    force: opts.force ?? false,
    dryRun: opts.dryRun ?? false,
    siteStage: opts.siteStage ?? process.env.SITE_STAGE,
    log: opts.log ?? ((line) => console.log(line)),
    exec: opts.exec ?? runProcess,
  };
}

// ── Process helpers ───────────────────────────────────────────────────────────

export interface ProcessResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export function runProcess(cmd: string, args: string[]): ProcessResult {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) {
    return { status: null, stdout: "", stderr: String(r.error.message ?? r.error) };
  }
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

const BREW_LINE = "brew install ffmpeg";

export function preflight(exec: typeof runProcess = runProcess): void {
  for (const bin of ["ffmpeg", "ffprobe"]) {
    const r = exec(bin, ["-version"]);
    if (r.status !== 0) {
      throw new EncodeError(
        "FFMPEG_MISSING",
        `${bin} is not on PATH. Install it with:\n  ${BREW_LINE}`,
      );
    }
  }
}

// ── Probe ─────────────────────────────────────────────────────────────────────

export interface ProbeResult {
  duration: number;
  width: number;
  height: number;
  /** Frames per second as a rational string, e.g. "30000/1001". */
  fps: string;
  fpsValue: number;
}

export function parseRational(r: string): number {
  const [n, d] = r.split("/").map(Number);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (d === undefined) return n;
  if (!Number.isFinite(d) || d <= 0) return 0;
  return n / d;
}

export function probe(file: string, exec: typeof runProcess = runProcess): ProbeResult {
  const r = exec("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,r_frame_rate,duration:format=duration",
    "-of",
    "json",
    file,
  ]);
  if (r.status !== 0) {
    throw new EncodeError("PROBE_FAILED", `ffprobe failed on ${file}: ${r.stderr.trim()}`);
  }
  let json: {
    streams?: Array<{ width?: number; height?: number; r_frame_rate?: string; duration?: string }>;
    format?: { duration?: string };
  };
  try {
    json = JSON.parse(r.stdout);
  } catch {
    throw new EncodeError("PROBE_FAILED", `ffprobe returned unparsable output for ${file}`);
  }
  const s = json.streams?.[0];
  const duration = Number(s?.duration ?? json.format?.duration);
  if (!s || !s.width || !s.height || !s.r_frame_rate || !Number.isFinite(duration) || duration <= 0) {
    throw new EncodeError("PROBE_FAILED", `no usable video stream in ${file}`);
  }
  let fps = s.r_frame_rate;
  let fpsValue = parseRational(fps);
  if (fpsValue <= 0) {
    throw new EncodeError("PROBE_FAILED", `unusable frame rate "${s.r_frame_rate}" in ${file}`);
  }
  // Web loops never need more than 30 fps; halve 50/59.94/60 sources.
  if (fpsValue > 40) {
    const [n, d = "1"] = fps.split("/");
    fps = `${n}/${Number(d) * 2}`;
    fpsValue = fpsValue / 2;
  }
  return { duration, width: s.width, height: s.height, fps, fpsValue };
}

// ── Validation against the probe ──────────────────────────────────────────────

export function validateAgainstProbe(entry: ManifestEntry, p: ProbeResult): void {
  if (entry.out > p.duration + 0.01) {
    throw new EncodeError(
      "RANGE_INVALID",
      `clip "${entry.id}": out=${entry.out}s is past the end of the source (${p.duration.toFixed(2)}s)`,
    );
  }
  const landscape = p.width >= p.height;
  if (entry.ratio === "16:9" && !landscape) {
    throw new EncodeError(
      "RATIO_MISMATCH",
      `clip "${entry.id}": ratio is 16:9 but the source is ${p.width}x${p.height} (portrait). Set ratio: "9:16".`,
    );
  }
  if (entry.ratio === "9:16" && landscape) {
    throw new EncodeError(
      "RATIO_MISMATCH",
      `clip "${entry.id}": ratio is 9:16 but the source is ${p.width}x${p.height} (landscape). Set ratio: "16:9".`,
    );
  }
  const L = outputLength(entry);
  if (entry.loop === "xfade" && L < XFADE_SECONDS * 4) {
    throw new EncodeError(
      "LOOP_TOO_SHORT",
      `clip "${entry.id}": xfade needs at least ${XFADE_SECONDS * 4}s of output; got ${L.toFixed(2)}s. Widen in/out or use loop: "none".`,
    );
  }
}

/** Output seconds before loop treatment: (out - in) / speed. */
export function outputLength(entry: ManifestEntry): number {
  return (entry.out - entry.in) / entry.speed;
}

// ── Hashing ───────────────────────────────────────────────────────────────────

export async function hashFile(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    createReadStream(file)
      .on("data", (chunk) => h.update(chunk))
      .on("error", reject)
      .on("end", () => resolve(h.digest("hex")));
  });
}

/** Stable JSON: sorted keys so key order in the manifest never changes the hash. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Fingerprint of the manifest entry alone (everything but `approved`); the guard recomputes it at build. */
export function entryHash(entry: Omit<ManifestEntry, "approved"> & { approved?: boolean }): string {
  const { approved: _approved, ...content } = entry;
  return createHash("sha256").update(stableStringify(content)).digest("hex").slice(0, 8);
}

export function contentHash(sourceHash: string, entry: ManifestEntry, preset: string): string {
  // `approved` is metadata, not content: flipping it must not re-encode.
  const { approved: _approved, ...content } = entry;
  const h = createHash("sha256");
  h.update(sourceHash);
  h.update("\n");
  h.update(stableStringify(content));
  h.update("\n");
  h.update(ENCODER_VERSION);
  h.update("\n");
  h.update(preset);
  return h.digest("hex").slice(0, 8);
}

// ── Output naming ─────────────────────────────────────────────────────────────

export function outputNames(id: string, hash: string, ratio: ManifestEntry["ratio"]) {
  const base = `${id}.${hash}`;
  return {
    base,
    mp4_720: `${base}.720.mp4`,
    mp4_1080: ratio === "16:9" ? `${base}.1080.mp4` : undefined,
    poster: `${base}.jpg`,
    poster_1920: ratio === "16:9" ? `${base}.poster.1920.jpg` : undefined,
    preview_916: ratio === "16:9" ? `${base}.preview-916.jpg` : undefined,
    sidecar: `${base}.json`,
  };
}

/** Matches `<id>.<hash8>.<rest>` output files in public/clips. */
export const OUTPUT_FILE_RE = /^([a-z0-9][a-z0-9-]*)\.([0-9a-f]{8})\.(.+)$/;

const FFMPEG_BASE = ["-y", "-hide_banner", "-loglevel", "error", "-nostdin"];

// ── Filter graph ──────────────────────────────────────────────────────────────

export interface GraphPlan {
  /** Input options placed before -i. */
  inputArgs: string[];
  filterComplex: string;
  /** Output label → rung. */
  outputs: Array<{ label: string; rung: "1080" | "720"; width: number; height: number; crf: number; maxrate: string }>;
  /** Expected output duration in seconds. */
  duration: number;
}

function fmt(n: number): string {
  return Number(n.toFixed(4)).toString();
}

function cover(width: number, height: number): string {
  return `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height},setsar=1`;
}

/**
 * Builds the ffmpeg filter graph for one entry. Pure: no I/O, so it is unit-tested directly.
 *
 * xfade: the 0.5 s overlap is taken from inside [in, out]; body first, blend at the
 * end, so frame 0 is a clean source frame that matches the poster and the loop is
 * 0.5 s shorter. pingpong: forward then reverse, dropping the duplicated frames at
 * both seams. none: play once.
 */
export function buildGraph(entry: ManifestEntry, p: ProbeResult): GraphPlan {
  const L = outputLength(entry);
  const D = XFADE_SECONDS;
  const fpsN = p.fpsValue;

  const inputArgs = ["-ss", fmt(entry.in), "-t", fmt(entry.out - entry.in)];
  const vertical = entry.ratio === "9:16";
  const master = vertical ? VERTICAL_RUNG : RUNGS["1080"];

  const parts: string[] = [];
  parts.push(
    `[0:v]setpts=(PTS-STARTPTS)/${fmt(entry.speed)},fps=${p.fps},${cover(master.width, master.height)},format=yuv420p[seg]`,
  );

  let duration: number;
  if (entry.loop === "xfade") {
    parts.push(`[seg]split=3[s0][s1][s2]`);
    parts.push(`[s0]trim=start=${fmt(D)}:end=${fmt(L - D)},setpts=PTS-STARTPTS[body]`);
    // xfade needs a constant frame rate on both inputs; trim drops the rate metadata, fps restores it.
    parts.push(`[s1]trim=start=${fmt(L - D)}:end=${fmt(L)},setpts=PTS-STARTPTS,fps=${p.fps}[tail]`);
    parts.push(`[s2]trim=end=${fmt(D)},setpts=PTS-STARTPTS,fps=${p.fps}[head]`);
    parts.push(`[tail][head]xfade=transition=fade:duration=${fmt(D)}:offset=0[blend]`);
    parts.push(`[body][blend]concat=n=2:v=1:a=0[master]`);
    duration = L - D;
  } else if (entry.loop === "pingpong") {
    const frames = Math.max(2, Math.round(L * fpsN));
    parts.push(`[seg]split[a][b]`);
    parts.push(`[b]reverse,trim=start_frame=1:end_frame=${frames - 1},setpts=PTS-STARTPTS[r]`);
    parts.push(`[a][r]concat=n=2:v=1:a=0[master]`);
    duration = (2 * frames - 2) / fpsN;
  } else {
    parts.push(`[seg]null[master]`);
    duration = L;
  }

  const outputs: GraphPlan["outputs"] = [];
  if (vertical) {
    parts.push(`[master]null[o720]`);
    outputs.push({
      label: "o720",
      rung: "720",
      width: VERTICAL_RUNG.width,
      height: VERTICAL_RUNG.height,
      crf: VERTICAL_RUNG.crf,
      maxrate: entry.maxrate?.["720"] ?? VERTICAL_RUNG.maxrate,
    });
  } else {
    parts.push(`[master]split[o1080][t720]`);
    parts.push(`[t720]${cover(RUNGS["720"].width, RUNGS["720"].height)}[o720]`);
    outputs.push({
      label: "o1080",
      rung: "1080",
      width: RUNGS["1080"].width,
      height: RUNGS["1080"].height,
      crf: RUNGS["1080"].crf,
      maxrate: entry.maxrate?.["1080"] ?? RUNGS["1080"].maxrate,
    });
    outputs.push({
      label: "o720",
      rung: "720",
      width: RUNGS["720"].width,
      height: RUNGS["720"].height,
      crf: RUNGS["720"].crf,
      maxrate: entry.maxrate?.["720"] ?? RUNGS["720"].maxrate,
    });
  }

  return { inputArgs, filterComplex: parts.join(";"), outputs, duration };
}

/** "4M" → "8M", "1.2M" → "2.4M", "1200k" → "2400k". bufsize is twice maxrate. */
export function doubleBitrate(rate: string): string {
  const m = rate.match(/^(\d+(?:\.\d+)?)([kKmM]?)$/);
  if (!m) return rate;
  return `${Number(m[1]) * 2}${m[2]}`;
}

export function encoderArgs(o: GraphPlan["outputs"][number], preset: string): string[] {
  return [
    "-map",
    `[${o.label}]`,
    "-c:v",
    "libx264",
    "-preset",
    preset,
    "-profile:v",
    "high",
    "-level",
    "4.0",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    String(o.crf),
    "-maxrate",
    o.maxrate,
    "-bufsize",
    doubleBitrate(o.maxrate),
    "-an",
    "-movflags",
    "+faststart",
  ];
}

// ── Sidecar ───────────────────────────────────────────────────────────────────

const sidecarSchema = z
  .object({
    id: z.string(),
    hash: z.string().regex(/^[0-9a-f]{8}$/),
    sourceHash: z.string(),
    encoderVersion: z.string(),
    preset: z.string(),
    entry: clipEntryBaseSchema.omit({ approved: true }),
    duration: z.number().positive(),
    files: z.object({
      mp4_720: z.string(),
      mp4_1080: z.string().optional(),
      poster: z.string(),
      poster_1920: z.string().optional(),
    }),
    preview: z.string().optional(),
    encodedAt: z.string(),
  })
  .strict();

export type Sidecar = z.infer<typeof sidecarSchema>;

/** A sidecar is trusted only if it parses AND names exactly the outputs its id and hash imply. */
async function readSidecar(file: string, id: string, hash: string, ratio: ManifestEntry["ratio"]): Promise<Sidecar | null> {
  let json: unknown;
  try {
    json = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
  const parsed = sidecarSchema.safeParse(json);
  if (!parsed.success) return null;
  const s = parsed.data;
  if (s.id !== id || s.hash !== hash) return null;
  const names = outputNames(id, hash, ratio);
  const expected: ClipFiles = {
    mp4_720: `/clips/${names.mp4_720}`,
    poster: `/clips/${names.poster}`,
    ...(names.mp4_1080 ? { mp4_1080: `/clips/${names.mp4_1080}` } : {}),
    ...(names.poster_1920 ? { poster_1920: `/clips/${names.poster_1920}` } : {}),
  };
  if (stableStringify(s.files) !== stableStringify(expected)) return null;
  return s;
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function nonEmpty(file: string): Promise<boolean> {
  try {
    return (await fs.stat(file)).size > 0;
  } catch {
    return false;
  }
}

// ── Manifest loading ──────────────────────────────────────────────────────────

export async function loadManifest(manifestPath: string): Promise<Manifest> {
  let raw: string;
  try {
    raw = await fs.readFile(manifestPath, "utf8");
  } catch {
    throw new EncodeError("MANIFEST_MISSING", `no manifest at ${manifestPath}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new EncodeError("MANIFEST_INVALID", `${manifestPath} is not valid JSON: ${(e as Error).message}`);
  }
  return parseManifest(json, manifestPath);
}

export function parseManifest(json: unknown, label = "manifest"): Manifest {
  const result = manifestSchema.safeParse(json);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`);
    throw new EncodeError("MANIFEST_INVALID", `${label} failed validation:\n${lines.join("\n")}`);
  }
  return result.data;
}

export function resolveSource(entry: ManifestEntry, sourceDir: string): string {
  return path.isAbsolute(entry.source) ? entry.source : path.join(sourceDir, entry.source);
}

// ── Index ─────────────────────────────────────────────────────────────────────

export function renderIndex(entries: ClipEntry[]): string {
  const body = entries
    .map((e) => `  ${JSON.stringify(e.id)}: ${JSON.stringify(e, null, 4).replace(/\n/g, "\n  ")},`)
    .join("\n");
  return [
    "// GENERATED by scripts/encode.ts from clips/manifest.json. Do not edit.",
    "// Regenerate with: npm run encode",
    'import type { ClipEntry } from "@/lib/clips.types";',
    "",
    "export const clips = {",
    body,
    "} as const satisfies Record<string, ClipEntry>;",
    "",
    "export type ClipId = keyof typeof clips;",
    "export const clipIds = Object.keys(clips) as ClipId[];",
    "",
  ].join("\n");
}

// ── Atomic write helpers ──────────────────────────────────────────────────────

async function writeFileAtomic(file: string, data: string): Promise<void> {
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, file);
}

// ── Per-entry encode ──────────────────────────────────────────────────────────

interface EncodeContext extends ResolvedOptions {
  tmpDir: string;
}

async function encodeOne(ctx: EncodeContext, entry: ManifestEntry, source: string, sourceHash: string, p: ProbeResult, hash: string): Promise<Sidecar> {
  const names = outputNames(entry.id, hash, entry.ratio);
  const plan = buildGraph(entry, p);

  const tmpFor = (name: string) => path.join(ctx.tmpDir, name);

  const args = [...FFMPEG_BASE, ...plan.inputArgs, "-i", source, "-filter_complex", plan.filterComplex];
  for (const o of plan.outputs) {
    const name = o.rung === "1080" ? names.mp4_1080! : names.mp4_720;
    args.push(...encoderArgs(o, ctx.preset), tmpFor(name));
  }
  const r = ctx.exec("ffmpeg", args);
  if (r.status !== 0) {
    throw new EncodeError("ENCODE_FAILED", `ffmpeg failed on clip "${entry.id}":\n${r.stderr.trim()}`);
  }

  // Posters from frame 0 of the encoded outputs, so they match the loop's first frame exactly.
  const posterArgs = (input: string, out: string, width: number | null, q: number) => [
    ...FFMPEG_BASE,
    "-i",
    input,
    "-frames:v",
    "1",
    ...(width ? ["-vf", `scale=${width}:-2`] : []),
    "-q:v",
    String(q),
    out,
  ];
  const posterWidth = entry.ratio === "16:9" ? 720 : null;
  const rp = ctx.exec("ffmpeg", posterArgs(tmpFor(names.mp4_720), tmpFor(names.poster), posterWidth, 4));
  if (rp.status !== 0) throw new EncodeError("ENCODE_FAILED", `poster failed on clip "${entry.id}":\n${rp.stderr.trim()}`);

  let previewName: string | undefined;
  if (names.mp4_1080 && names.poster_1920 && names.preview_916) {
    const r1920 = ctx.exec("ffmpeg", posterArgs(tmpFor(names.mp4_1080), tmpFor(names.poster_1920), null, 3));
    if (r1920.status !== 0) throw new EncodeError("ENCODE_FAILED", `1920 poster failed on clip "${entry.id}":\n${r1920.stderr.trim()}`);

    // Review-only 9:16 preview: the exact cover crop a phone hero shows for this focal.
    const focal = entry.focal ?? { x: 0.5, y: 0.5 };
    const { width: W, height: H } = RUNGS["1080"];
    const cropW = Math.round((H * 9) / 16 / 2) * 2; // even width for the JPEG encoder
    const x = Math.round(focal.x * (W - cropW));
    const rpv = ctx.exec("ffmpeg", [
      ...FFMPEG_BASE,
      "-i",
      tmpFor(names.poster_1920),
      "-vf",
      `crop=${cropW}:${H}:${x}:0`,
      "-q:v",
      "3",
      tmpFor(names.preview_916),
    ]);
    if (rpv.status !== 0) throw new EncodeError("ENCODE_FAILED", `preview-916 failed on clip "${entry.id}":\n${rpv.stderr.trim()}`);
    previewName = names.preview_916;
  }

  const encoded = probe(tmpFor(names.mp4_720), ctx.exec);

  const files: ClipFiles = {
    mp4_720: `/clips/${names.mp4_720}`,
    poster: `/clips/${names.poster}`,
    ...(names.mp4_1080 ? { mp4_1080: `/clips/${names.mp4_1080}` } : {}),
    ...(names.poster_1920 ? { poster_1920: `/clips/${names.poster_1920}` } : {}),
  };

  const { approved: _approved, ...content } = entry;
  const sidecar: Sidecar = {
    id: entry.id,
    hash,
    sourceHash,
    encoderVersion: ENCODER_VERSION,
    preset: ctx.preset,
    entry: content,
    duration: Number(encoded.duration.toFixed(3)),
    files,
    ...(previewName ? { preview: previewName } : {}),
    encodedAt: new Date().toISOString(),
  };

  // Move outputs into place: rename is atomic on the same filesystem.
  const moves: Array<[string, string]> = [
    [names.mp4_720, path.join(ctx.outDir, names.mp4_720)],
    [names.poster, path.join(ctx.outDir, names.poster)],
  ];
  if (names.mp4_1080) moves.push([names.mp4_1080, path.join(ctx.outDir, names.mp4_1080)]);
  if (names.poster_1920) moves.push([names.poster_1920, path.join(ctx.outDir, names.poster_1920)]);
  if (previewName) {
    await fs.mkdir(ctx.previewDir, { recursive: true });
    moves.push([previewName, path.join(ctx.previewDir, previewName)]);
  }
  for (const [from, to] of moves) await fs.rename(tmpFor(from), to);

  return sidecar;
}

// ── Prune ─────────────────────────────────────────────────────────────────────

async function pruneDir(dir: string, keep: Set<string>): Promise<string[]> {
  const pruned: string[] = [];
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return pruned;
  }
  for (const name of names) {
    const m = name.match(OUTPUT_FILE_RE);
    if (!m) continue;
    const base = `${m[1]}.${m[2]}`;
    if (keep.has(base)) continue;
    await fs.rm(path.join(dir, name), { force: true });
    pruned.push(name);
  }
  return pruned;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function encode(opts: EncodeOptions = {}): Promise<EncodeSummary> {
  const o = resolveOptions(opts);
  const log = o.log;

  preflight(o.exec);
  const manifest = await loadManifest(o.manifestPath);

  if (o.siteStage === "live") {
    const unapproved = manifest.clips.filter((c) => !c.approved).map((c) => c.id);
    if (unapproved.length) {
      throw new EncodeError(
        "UNAPPROVED_LIVE",
        `SITE_STAGE=live but these clips are not approved: ${unapproved.join(", ")}. Set approved: true once Sam confirms each one.`,
      );
    }
  }

  // Validate everything before touching the disk.
  const plans: Array<{ entry: ManifestEntry; source: string; sourceHash: string; probe: ProbeResult; hash: string }> = [];
  for (const entry of manifest.clips) {
    const source = resolveSource(entry, o.sourceDir);
    if (!(await exists(source))) {
      throw new EncodeError("SOURCE_MISSING", `clip "${entry.id}": source not found at ${source}`);
    }
    const p = probe(source, o.exec);
    validateAgainstProbe(entry, p);
    const sourceHash = await hashFile(source);
    const hash = contentHash(sourceHash, entry, o.preset);
    plans.push({ entry, source, sourceHash, probe: p, hash });
  }

  const summary: EncodeSummary = { encoded: [], skipped: [], pruned: [], index: {} };

  if (o.dryRun) {
    for (const pl of plans) {
      const plan = buildGraph(pl.entry, pl.probe);
      log(`[dry-run] ${pl.entry.id} → ${outputNames(pl.entry.id, pl.hash, pl.entry.ratio).base} (${plan.duration.toFixed(2)}s, ${pl.entry.loop})`);
    }
    return summary;
  }

  await fs.mkdir(o.outDir, { recursive: true });
  await fs.mkdir(o.sidecarDir, { recursive: true });

  // One encode at a time per output directory: a second run would otherwise
  // delete the first run's in-flight temp files. The lock lives beside the
  // sidecars, never under public/.
  const lockPath = path.join(o.sidecarDir, ".encode.lock");
  try {
    await fs.writeFile(lockPath, `${process.pid}\n`, { flag: "wx" });
  } catch {
    throw new EncodeError("LOCKED", `another encode is running (or crashed) in ${o.outDir}; remove ${lockPath} if no ffmpeg is alive`);
  }

  const tmpDir = path.join(o.outDir, `.tmp-${process.pid}`);
  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.mkdir(tmpDir, { recursive: true });
  const ctx: EncodeContext = { ...o, tmpDir };

  const entries: ClipEntry[] = [];
  const keep = new Set<string>();

  try {
    for (const pl of plans) {
      const names = outputNames(pl.entry.id, pl.hash, pl.entry.ratio);
      const sidecarPath = path.join(o.sidecarDir, names.sidecar);
      let sidecar: Sidecar | null = o.force ? null : await readSidecar(sidecarPath, pl.entry.id, pl.hash, pl.entry.ratio);

      if (sidecar) {
        const allPresent = (
          await Promise.all(Object.values(sidecar.files).map((url) => nonEmpty(path.join(o.outDir, path.basename(url)))))
        ).every(Boolean);
        if (!allPresent) sidecar = null;
      }

      if (sidecar) {
        summary.skipped.push(pl.entry.id);
        log(`= ${pl.entry.id} unchanged (${pl.hash})`);
      } else {
        log(`> ${pl.entry.id} encoding (${pl.hash}, ${pl.entry.loop}, ${pl.entry.ratio})`);
        sidecar = await encodeOne(ctx, pl.entry, pl.source, pl.sourceHash, pl.probe, pl.hash);
        await writeFileAtomic(sidecarPath, JSON.stringify(sidecar, null, 2) + "\n");
        summary.encoded.push(pl.entry.id);
      }

      keep.add(names.base);
      entries.push({
        id: pl.entry.id,
        hash: pl.hash,
        entryHash: entryHash(pl.entry),
        ratio: pl.entry.ratio,
        focal: pl.entry.focal ?? { x: 0.5, y: 0.5 },
        loop: pl.entry.loop,
        duration: sidecar.duration,
        approved: pl.entry.approved,
        hero: pl.entry.hero,
        files: sidecar.files,
      });
    }

    // Publish the new index first; only then garbage-collect the old generation,
    // so a failure between the two never leaves an index pointing at deleted files.
    await fs.mkdir(path.dirname(o.indexPath), { recursive: true });
    await writeFileAtomic(o.indexPath, renderIndex(entries));
    for (const e of entries) summary.index[e.id] = e;

    summary.pruned.push(...(await pruneDir(o.outDir, keep)));
    summary.pruned.push(...(await pruneDir(o.sidecarDir, keep)));
    summary.pruned.push(...(await pruneDir(o.previewDir, keep)));
    for (const name of summary.pruned) log(`- pruned ${name}`);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.rm(lockPath, { force: true });
  }

  log(
    `done: ${summary.encoded.length} encoded, ${summary.skipped.length} unchanged, ${summary.pruned.length} pruned → ${path.relative(process.cwd(), o.indexPath)}`,
  );
  return summary;
}

// ── CLI ───────────────────────────────────────────────────────────────────────

export function parseArgs(argv: string[]): EncodeOptions {
  const { values } = nodeParseArgs({
    args: argv,
    options: {
      force: { type: "boolean" },
      "dry-run": { type: "boolean" },
      manifest: { type: "string" },
      out: { type: "string" },
      preset: { type: "string" },
    },
    strict: true,
  });
  const opts: EncodeOptions = {};
  if (values.force) opts.force = true;
  if (values["dry-run"]) opts.dryRun = true;
  if (values.manifest) opts.manifestPath = path.resolve(values.manifest);
  if (values.out) opts.outDir = path.resolve(values.out);
  if (values.preset) opts.preset = values.preset;
  return opts;
}

if (isMain(import.meta.url)) {
  loadDotEnv();
  let cliOpts: EncodeOptions;
  try {
    cliOpts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`usage: npm run encode -- [--force] [--dry-run] [--manifest <file>] [--out <dir>] [--preset <x264 preset>]\n${(err as Error).message}`);
    process.exit(2);
  }
  encode(cliOpts).catch((err) => {
    if (err instanceof EncodeError) {
      console.error(err.message);
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  });
}
