# Developing the Hobbs Media Co. site

Technical reference. The plain-language guide for Sam is the
[README](../README.md); working rules for coding agents are in
[`CLAUDE.md`](../CLAUDE.md). Design source of truth:
[`designs/hobbs-media-portfolio.md`](designs/hobbs-media-portfolio.md) (the
amendment sections override the body). Tokens: [`DESIGN.md`](../DESIGN.md).

Next.js App Router, TypeScript, Tailwind, Vercel. Node 20.12 or newer;
ffmpeg and ffprobe on PATH for the encoder and the unit tests.

## Hosting and releases

- Live at https://hobbsmediaco.com from Sam's Vercel account (project
  `hobbs-media-portfolio`, Hobby plan, single member). The repo is public;
  Vercel Hobby only builds non-owner commits from public repositories.
- The Vercel project is connected to this GitHub repo. **Production branch is
  `live`**; every other branch, including `main`, builds a preview. The Vercel
  bot posts each preview URL on the pull request.
- Release: merge to `main`, check the preview, then `git push origin main:live`.
  Production has `SITE_STAGE=live` and `SITE_URL=https://hobbsmediaco.com`;
  previews have `SITE_STAGE=review`.
- Domain: `hobbsmediaco.com` at Namecheap (A `216.198.79.1`; `www` CNAME
  `cname.vercel-dns.com`), attached to the project with a `www` to apex 308.

## Stages, the launch theme, and the guard

`SITE_STAGE` must be exactly `review` or `live` (`.env.example`).
`VERCEL_ENV=production` requires `live`.

`launchTheme` in `content/config.ts` is `dark`. With a launch theme set,
`href()` emits theme-less paths and `next.config.ts` serves the bare root from
`/dark` (a fallback rewrite, so real files, pages and dynamic routes win) and
301s `/dark` and `/dark/*` to `/*` with `opengraph-image` paths exempted. At
`live` the other three themes (`light`, `twilight`, `hobbs`) and the
review-only sample calling cards 404; on preview builds they remain reachable
under their segment for comparison.

The prebuild guard (`npm run guard`, also the `prebuild` script) prints every
unconfirmed `todo()` fact and every unapproved referenced clip. In review it
passes; at `live` it refuses until the list is empty, and additionally needs
`launchTheme` set, an absolute https `SITE_URL`, and no unapproved clip in the
publication set. At every stage it fails on over-limit plaque strings (design
17A) and content integrity: a manifest that fails the schema; an index that
disagrees with the manifest (ids, `approved`, or an edited entry: the guard
and the encoder hash entries the same way, so a manifest edit without
`npm run encode` is caught); files named by the index missing or empty under
`public/clips/`; dangling clip or agent references; duplicate or malformed
slugs.

## Content

Everything the site says lives in `content/`:

- `site.ts`: brand, contact (`instagram: null` hides the line), the home
  plaque (three lines, each 32 characters or fewer), services, all copy, stats
  (empty until Sam supplies three real numbers), `heroClip`.
- `work.ts`: the selected-work stack, in order. `title` up to 28 characters.
- `agents.ts`, `properties.ts`: calling cards. The samples (`jessica`,
  `ocean-ave`) exist on review builds only.
- `vocabulary.ts`: the three service names (long and short forms).
- `config.ts`: `launchTheme`, `reviewTheme`, `siteUrl()`.
- `todo.ts`: `todo(label, value)` marks an unconfirmed fact; the guard lists
  them and refuses a live build while any remain. All facts are confirmed as
  of 2026-09-24; wrap new unconfirmed ones the same way.

## Footage pipeline

Source files never enter git. `clips/source/` (gitignored, or
`CLIPS_SOURCE_DIR` in `.env.local`) holds them locally; encoded outputs in
`public/clips/` and sidecars in `clips/sidecars/` are committed.

1. Put the source in `clips/source/` (any container ffmpeg reads; 4K 10-bit
   HEVC from the drone is fine).
2. Add an entry to `clips/manifest.json`:

   ```json
   {
     "id": "evening-sail",
     "source": "evening-sail.mov",
     "in": 12,
     "out": 22,
     "speed": 1,
     "focal": { "x": 0.5, "y": 0.45 },
     "loop": "xfade",
     "ratio": "16:9",
     "hero": false,
     "approved": true
   }
   ```

   - `id`: lowercase kebab-case, at most 48 characters, unique.
   - `in`/`out`: seconds in the source; `out` must be past `in` and within
     the file. 6 to 12 s of footage loops best.
   - `speed`: 1 is real time; 1.2 to 1.5 tightens a slow pan.
   - `loop`: `xfade` for drifts and anything with continuous motion (0.5 s
     dissolve taken from inside `in`..`out`; needs at least 2 s), `pingpong`
     for one-way moves (forward then reverse), `none` plays once and holds the
     last frame (on a phone that reads as a frozen video; avoid it).
   - `focal`: the point that must stay in frame when a phone cover-crops the
     16:9 encode; required for `hero: true`. Check the crop in
     `clips/preview/<id>.<hash>.preview-916.jpg` after encoding.
   - `maxrate`: per-rung override when water shimmer or a sunset gradient
     bands; raise it for that entry rather than lowering CRF globally.
   - `approved`: true for anything Sam added or signed off.
3. `npm run encode`. Unchanged clips are skipped (sidecar hash); stale outputs
   are pruned; `content/clips.generated.ts` is rewritten. Outputs are
   `<id>.<hash8>.{1080,720}.mp4`, `<id>.<hash8>.jpg` (poster), and a 1920
   poster for 16:9. `ENCODE_PRESET` (default `medium`) or `-- --preset slow`.
4. Reference the id from `content/work.ts` (stack), `content/site.ts`
   (`heroClip`) or `content/properties.ts` (`reel`).
5. `npm run guard`, `npm test`, commit `clips/manifest.json`,
   `clips/sidecars/`, `public/clips/`, `content/clips.generated.ts`, and the
   content change. Push.

Removing a clip: delete its manifest entry and every reference, run
`npm run encode` (prunes the outputs), commit.

Fetching a source from a Google Drive share link (`anyone with the link`):

```bash
# FILE_ID is the long id in the share URL
pipx run gdown "https://drive.google.com/uc?id=FILE_ID" -O clips/source/evening-sail.mov
# or, for files small enough to skip Drive's virus-scan page
curl -L "https://drive.google.com/uc?export=download&id=FILE_ID&confirm=t" -o clips/source/evening-sail.mov
ffprobe -v error -show_entries stream=codec_name,width,height:format=duration clips/source/evening-sail.mov
```

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

Playwright browsers: `npx playwright install webkit`; the desktop project uses
the installed Google Chrome (Playwright's open-source Chromium has no H.264).
Run `npm run build` before `npm run test:e2e`; the Playwright web server only
starts `next start`, it does not build.

Scripts run with `tsx`, which does not load `.env*` by itself.
`scripts/guard.ts` loads env through `@next/env`, the same files in the same
order as `next build`, so it judges the same `SITE_STAGE` the build renders.
`scripts/encode.ts` uses the small loader in `scripts/env.ts` (`.env.local`
then `.env`). In both, a variable already set in the shell wins.

Deploys from a laptop: `npx vercel@latest` cannot deploy this project (it is
in Sam's single-member account). Deploy by pushing. `.vercelignore` exists for
the day that changes; it keeps `clips/source/` out of any CLI upload.

## Layout

- `app/<theme>/`: one explicit route tree per theme: `page.tsx`,
  `for/[agent]/page.tsx`, `p/[slug]/page.tsx`, each with an
  `opengraph-image.tsx`. Every file is a few lines binding the theme to the
  factories in `site/page.tsx` and `site/og.tsx`; params are static and
  unknown slugs are 404s. The segment is not dynamic because Next.js does not
  allow OG images under an optional catch-all.
- `content/`: every fact and list the site renders, plus the generated clip
  index `clips.generated.ts`. Never edit the index by hand; run `npm run encode`.
- `components/`: sections, calling card, plaque, header;
  `components/hero/HeroIsland.tsx` is the raw-HTML hero island.
- `lib/`: `VideoBudget.ts` (one decoder at a time), `playbackPolicy.ts`,
  `heroIsland.ts`, `scrollDim.ts`, `plaque.ts` (17A limits), `stage.ts`,
  `href.ts`.
- `clips/`: `manifest.json`, `manifest.schema.ts`, `placeholders.sh`
  (synthetic sources for exercising the pipeline), sidecars in
  `clips/sidecars/` (committed); `source/` and `preview/` are gitignored.
- `scripts/`: `encode.ts`, `guard.ts`, `env.ts`, `isMain.ts`.
- `styles/tokens.css`: the `DESIGN.md` token sheet as CSS variables per theme;
  `fonts/`: self-hosted faces, two families per theme.
- `test/unit/` (Vitest, `vitest.config.ts`) and `test/e2e/` (Playwright,
  `playwright.config.ts`).

## Acceptance targets (real-phone check)

- First hero frame under 1.5 s on LTE; under 4 MB transferred before the reel plays.
- Lighthouse mobile performance 90 or better on `/`.
- Selected work plays one clip at a time with no blank frames on an iPhone.
- Low Power Mode: poster plus TAP TO PLAY, nothing errors (manual).
- `/for/<agent>` pasted into iMessage shows the poster, the wordmark, and the name.

Record the numbers in `designs/hobbs-media-portfolio.md` (T12).

## Test map and other docs

- [`test-map.md`](test-map.md): which test covers which failure mode, built
  from [`designs/test-plan.md`](designs/test-plan.md).
- [`../CHANGELOG.md`](../CHANGELOG.md): release notes; versions are
  `MAJOR.MINOR.PATCH.MICRO` (`VERSION`).
- [`../TODOS.md`](../TODOS.md): deferred work with effort, priority and dependencies.
