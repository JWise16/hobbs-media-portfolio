import { z } from "zod";

/**
 * `clips/manifest.json` is the single source of truth for clips. One entry per
 * loop; the encode script turns each into hashed outputs under public/clips/.
 *
 * Timestamps `in`/`out` are seconds in the source. `speed` > 1 speeds up.
 * `focal` is the point that must stay in frame when the 16:9 encode is
 * cover-cropped to a phone (object-position). `loop` picks the seam.
 */

export const focalSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const loopSchema = z.enum(["xfade", "pingpong", "none"]);
export const ratioSchema = z.enum(["16:9", "9:16"]);

/** ffmpeg bitrate strings such as "4M" or "1200k". */
const bitrateSchema = z.string().regex(/^\d+(\.\d+)?[kKmM]?$/, "bitrate like 4M or 1200k");

export const clipEntrySchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]*$/, "id must be lowercase kebab-case (a-z, 0-9, -)")
      .max(48),
    /** Path to the source file. Relative paths resolve against CLIPS_SOURCE_DIR (default clips/source). */
    source: z.string().min(1),
    in: z.number().min(0),
    out: z.number().positive(),
    speed: z.number().positive().default(1),
    focal: focalSchema.optional(),
    loop: loopSchema,
    ratio: ratioSchema.default("16:9"),
    /** Per-rung maxrate override; raise when water shimmer or sunset gradients band. */
    maxrate: z
      .object({
        "1080": bitrateSchema.optional(),
        "720": bitrateSchema.optional(),
      })
      .optional(),
    approved: z.boolean().default(false),
    hero: z.boolean().default(false),
  })
  .strict()
  .superRefine((entry, ctx) => {
    if (entry.in >= entry.out) {
      ctx.addIssue({ code: "custom", path: ["out"], message: `out (${entry.out}) must be greater than in (${entry.in})` });
    }
    if (entry.hero && !entry.focal) {
      ctx.addIssue({ code: "custom", path: ["focal"], message: `focal is required for hero clip "${entry.id}"` });
    }
  });

export const manifestSchema = z
  .object({
    clips: z.array(clipEntrySchema).min(1),
  })
  .strict()
  .superRefine((manifest, ctx) => {
    const seen = new Set<string>();
    manifest.clips.forEach((clip, i) => {
      if (seen.has(clip.id)) {
        ctx.addIssue({ code: "custom", path: ["clips", i, "id"], message: `duplicate clip id "${clip.id}"` });
      }
      seen.add(clip.id);
    });
  });

export type ManifestEntry = z.infer<typeof clipEntrySchema>;
export type Manifest = z.infer<typeof manifestSchema>;
export type ManifestEntryInput = z.input<typeof clipEntrySchema>;
