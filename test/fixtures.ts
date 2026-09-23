/**
 * Generates short synthetic clips with ffmpeg so encode tests run for real
 * (eng review 7A). A 2 s 16:9 clip and a 2 s 9:16 clip, cached per process.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface Fixtures {
  dir: string;
  landscape: string;
  portrait: string;
}

let cached: Fixtures | null = null;
const created: string[] = [];

process.on("exit", () => {
  for (const dir of created) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
});

export function makeFixtureClip(file: string, width: number, height: number, seconds = 2, fps = 30): void {
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      `testsrc2=size=${width}x${height}:rate=${fps}:duration=${seconds}`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-an",
      file,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`fixture ffmpeg failed: ${r.stderr}`);
}

export function fixtures(): Fixtures {
  if (cached) return cached;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hobbs-fixtures-"));
  created.push(dir);
  const landscape = path.join(dir, "landscape.mp4");
  const portrait = path.join(dir, "portrait.mp4");
  makeFixtureClip(landscape, 1280, 720);
  makeFixtureClip(portrait, 720, 1280);
  cached = { dir, landscape, portrait };
  return cached;
}

export function tmpWorkspace(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hobbs-encode-"));
  created.push(dir);
  return dir;
}
