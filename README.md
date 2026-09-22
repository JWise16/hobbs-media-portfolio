# Hobbs Media Co. portfolio

Portfolio and calling-card site for Sam (Hobbs Media Co.), a Seattle / Puget
Sound real estate photo, film, and drone videographer. Next.js App Router,
TypeScript, Tailwind, Vercel. Design source of truth:
[`docs/designs/hobbs-media-portfolio.md`](docs/designs/hobbs-media-portfolio.md)
(the amendment sections override the body). Tokens: [`DESIGN.md`](DESIGN.md).

## Review links

During review every route lives under a theme segment. Four links go to Sam:

| Theme | Home | Calling card |
|---|---|---|
| `dark` (mockup reference) | `/dark` | `/dark/for/jessica`, `/dark/p/ocean-ave` |
| `light` | `/light` | `/light/for/jessica` |
| `twilight` | `/twilight` | `/twilight/for/jessica` |
| `hobbs` (Sam's Lovable design, rebuilt) | `/hobbs` | `/hobbs/for/jessica` |

All facts on the review links are placeholders until Sam confirms them, and
the PENDING tag marks clips he has not approved. Do not forward review links
to agents.

## Source archive (never committed)

Sam's raw footage lives in a shared folder Sam owns, mirrored to a local drive:

- Shared folder: _to be filled in when Sam shares it_
- Local mirror: set `CLIPS_SOURCE_DIR` in `.env.local` (default `clips/source/`, gitignored)

Until real footage lands, `clips/placeholders.sh` generates synthetic gradient
sources so the pipeline and the site have something to play. They are never
approved and never ship.

## Encode workflow (manifest edit to deployed clip in under ten minutes)

1. Drop the source file in `CLIPS_SOURCE_DIR`.
2. Add one entry to `clips/manifest.json`:

   ```json
   {
     "id": "sailboat-orbit",
     "source": "DJI_0042.MP4",
     "in": 41.5,
     "out": 51.0,
     "speed": 1,
     "focal": { "x": 0.5, "y": 0.55 },
     "loop": "xfade",
     "ratio": "16:9",
     "hero": true,
     "approved": false
   }
   ```

   `loop`: `xfade` for slow drifts (the 0.5 s overlap is taken from inside
   `in`..`out`), `pingpong` for one-way moves, `none` to play once. `focal` is
   the point that must stay in frame when a phone cover-crops the 16:9 encode;
   it is required for hero clips. Check the crop in
   `clips/preview/<id>.<hash>.preview-916.jpg` after encoding. If water or a
   sunset bands, raise that entry's `maxrate` rather than lowering CRF globally.
3. `npm run encode`. Unchanged clips are skipped (sidecar hash); stale outputs
   are pruned; `content/clips.generated.ts` is rewritten.
4. Reference the id from `content/work.ts`, `content/site.ts` (`heroClip`), or
   `content/properties.ts` (`reel`).
5. Commit `public/clips/`, `clips/manifest.json`, and the generated index. Push.

Requires ffmpeg and ffprobe on PATH (`brew install ffmpeg`).

## Stages and the guard

`SITE_STAGE` must be exactly `review` or `live` (`.env.example`). The prebuild
guard (`npm run guard`) prints every unconfirmed `todo()` fact and every
unapproved referenced clip. In review it passes; at `live` it refuses until
the list is empty. `VERCEL_ENV=production` requires `live`. Plaque and name
limits (design 17A) fail the build at every stage.

Launch is: set `SITE_STAGE=live` in Vercel, mark clips `approved: true`,
unwrap every `todo()` with Sam's confirmed value, set `launchTheme` in
`content/config.ts`, deploy.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | guard, then `next build` |
| `npm run encode` | footage pipeline (`-- --dry-run`, `-- --force`) |
| `npm run guard` | placeholder and approval report |
| `npm test` | Vitest units (encode runs on a 2 s ffmpeg fixture) |
| `npm run test:e2e` | Playwright: iPhone 14 WebKit + desktop Chromium, plus reduced-motion variants, against `next start` |
| `PREVIEW_URL=https://… npm run test:e2e -- preview-public` | logged-out check against a deployed preview |

Playwright browsers: `npx playwright install chromium webkit`.

## Acceptance targets (real-phone check at the four-link milestone)

- First hero frame under 1.5 s on LTE; under 4 MB transferred before the reel plays.
- Lighthouse mobile performance ≥ 90 on `/dark` against the preview URL.
- Selected work plays one clip at a time with no blank frames on an iPhone.
- Low Power Mode: poster plus TAP TO PLAY, nothing errors (manual).
- `/dark/for/jessica` pasted into iMessage shows the poster, the wordmark, and the name.

Record the numbers in `docs/designs/hobbs-media-portfolio.md` (T12).

## Test map

The failure-modes table and the VideoBudget state diagram in the design doc
map onto `test/unit/*` and `test/e2e/*`; see [`docs/test-map.md`](docs/test-map.md).
