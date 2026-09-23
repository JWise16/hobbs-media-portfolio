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

Sam's first clips (iCloud copies at 1280x720) are in `clips/source/` locally
and encoded into `public/clips/`. They are unapproved until Sam confirms each
one. For launch, replace them with the camera originals (4K): the 1080 rung is
an upscale until then. `clips/placeholders.sh` still generates synthetic
sources if the pipeline needs exercising without footage.

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
5. Commit `public/clips/`, `clips/sidecars/`, `clips/manifest.json`, and the
   generated index. Push. (Sidecars record source paths, so they live outside
   `public/` and are never served.)

Requires Node 20.12 or newer (`engines` in `package.json`) and ffmpeg and
ffprobe on PATH (`brew install ffmpeg`). `ENCODE_PRESET` (default `medium`)
sets the x264 preset; `-- --preset slow` overrides it for one run.

## Stages and the guard

`SITE_STAGE` must be exactly `review` or `live` (`.env.example`). The prebuild
guard (`npm run guard`) prints every unconfirmed `todo()` fact and every
unapproved referenced clip. In review it passes; at `live` it refuses until
the list is empty. `VERCEL_ENV=production` requires `live`. Plaque and name
limits (design 17A) fail the build at every stage.

At every stage the guard also fails on content integrity problems, listing all
of them at once: a manifest that fails the schema; a generated index that
disagrees with the manifest (ids, `approved`, or an edited entry: the guard
and the encoder hash entries the same way, so a manifest edit without
`npm run encode` is caught); files named by the index that are missing or
empty under `public/clips/`; dangling clip or agent references; duplicate or
malformed slugs. At `live` it additionally requires `SITE_URL` to be an
absolute https URL (og:image links depend on it) and refuses any unapproved
clip still in the publication set, even one nothing references.

Launch is: set `SITE_STAGE=live` and `SITE_URL` in Vercel, mark clips
`approved: true`, unwrap every `todo()` with Sam's confirmed value, set
`launchTheme` in `content/config.ts`, deploy.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | guard, then `next build` |
| `npm run start` | serve the last build (`next start`) |
| `npm run encode` | footage pipeline (`-- --dry-run`, `-- --force`, `-- --preset <x264 preset>`, `-- --manifest <file>`, `-- --out <dir>`) |
| `npm run guard` | placeholder, approval and integrity report |
| `npm test` / `npm run test:unit` | Vitest units (encode runs on a 2 s ffmpeg fixture, so ffmpeg is required here too) |
| `npm run test:e2e` | Playwright: iPhone 14 WebKit + desktop Google Chrome (`channel: "chrome"`, for H.264), plus reduced-motion variants, against `next start` of the last `npm run build` (port 3210, `PW_PORT` overrides) |
| `PREVIEW_URL=https://… npm run test:e2e -- preview-public` | logged-out check against a deployed preview |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `eslint .` |

Playwright browsers: `npx playwright install webkit`; the desktop project uses the installed Google Chrome (Playwright's open-source Chromium has no H.264). Run `npm run build` before `npm run test:e2e`; the Playwright web server only starts `next start`, it does not build.

Scripts run with `tsx`, which does not load `.env*` by itself. `scripts/guard.ts` loads env through `@next/env`, the same files in the same order as `next build` (`.env.production.local`, `.env.local`, `.env`, …), so it judges the same `SITE_STAGE` the build renders. `scripts/encode.ts` uses the small loader in `scripts/env.ts` (`.env.local` then `.env`). In both, a variable already set in the shell wins.

## Acceptance targets (real-phone check at the four-link milestone)

- First hero frame under 1.5 s on LTE; under 4 MB transferred before the reel plays.
- Lighthouse mobile performance ≥ 90 on `/dark` against the preview URL.
- Selected work plays one clip at a time with no blank frames on an iPhone.
- Low Power Mode: poster plus TAP TO PLAY, nothing errors (manual).
- `/dark/for/jessica` pasted into iMessage shows the poster, the wordmark, and the name.

Record the numbers in `docs/designs/hobbs-media-portfolio.md` (T12).

## Layout

- `app/<theme>/` — one explicit route tree per theme: `page.tsx`, `for/[agent]/page.tsx`, `p/[slug]/page.tsx`, each with an `opengraph-image.tsx`. Every file is a few lines binding the theme to the factories in `site/page.tsx` and `site/og.tsx`; params are static and unknown slugs are 404s. The segment is not dynamic because Next.js does not allow OG images under an optional catch-all.
- `content/` — every fact and list the site renders (`site.ts`, `work.ts`, `agents.ts`, `properties.ts`, `config.ts`, `todo.ts`) and the generated clip index `clips.generated.ts`. Never edit the index by hand; run `npm run encode`.
- `components/` — sections, calling card, plaque, header; `components/hero/HeroIsland.tsx` is the raw-HTML hero island.
- `lib/` — `VideoBudget.ts` (one decoder at a time), `playbackPolicy.ts`, `heroIsland.ts`, `scrollDim.ts`, `plaque.ts` (17A limits), `stage.ts`, `href.ts`.
- `clips/` — `manifest.json`, `manifest.schema.ts`, `placeholders.sh`, encode sidecars in `clips/sidecars/` (committed); `source/` and `preview/` are gitignored.
- `scripts/` — `encode.ts`, `guard.ts`, `env.ts` (dotenv for the encoder), `isMain.ts`.
- `styles/tokens.css` — the `DESIGN.md` token sheet as CSS variables per theme; `fonts/` — self-hosted faces, two families per theme.
- `test/unit/` (Vitest, `vitest.config.ts`) and `test/e2e/` (Playwright, `playwright.config.ts`).

## Test map

The failure-modes table and the VideoBudget state diagram in the design doc
map onto `test/unit/*` and `test/e2e/*`; see [`docs/test-map.md`](docs/test-map.md).
The eng-review test plan that the map was built from is
[`docs/designs/test-plan.md`](docs/designs/test-plan.md).

## Other docs

- [`CHANGELOG.md`](CHANGELOG.md) — release notes; versions are `MAJOR.MINOR.PATCH.MICRO` (`VERSION`).
- [`TODOS.md`](TODOS.md) — deferred work with effort, priority and dependencies.
- [`CLAUDE.md`](CLAUDE.md) — working rules for coding agents.
