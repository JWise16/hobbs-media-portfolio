/**
 * Shape of `content/clips.generated.ts`, the index the encode script emits.
 * This file is hand-written and is the agreed contract between the pipeline
 * (scripts/encode.ts) and the components. Nothing builds a clip URL by hand;
 * every path comes from `files`.
 */

export type ClipLoop = "xfade" | "pingpong" | "none";
export type ClipRatio = "16:9" | "9:16";

export interface ClipFocal {
  /** 0..1, left to right. Drives `object-position`. */
  x: number;
  /** 0..1, top to bottom. */
  y: number;
}

export interface ClipFiles {
  /** Public URL of the 720 rung. Always present. */
  mp4_720: string;
  /** Public URL of the 1080 rung. Absent for native 9:16 sources (single rung set). */
  mp4_1080?: string;
  /** Public URL of the 720 px wide poster (frame 0 of the 720 encode). */
  poster: string;
  /** Public URL of the 1920 px wide poster (frame 0 of the 1080 encode). Absent for 9:16. */
  poster_1920?: string;
}

export interface ClipEntry {
  id: string;
  /** Eight hex chars of the content hash; part of every output file name. */
  hash: string;
  ratio: ClipRatio;
  focal: ClipFocal;
  loop: ClipLoop;
  /** Seconds, of the encoded loop (after in/out, speed, and loop trimming). */
  duration: number;
  /** Clip approved by Sam for the public site. Unapproved clips render a PENDING tag in review. */
  approved: boolean;
  /** Center-weighted hero pick; `focal` is required for these. */
  hero: boolean;
  files: ClipFiles;
}
