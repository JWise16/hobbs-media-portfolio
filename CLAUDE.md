# Hobbs Media Co. portfolio

Portfolio site for Sam (Hobbs Media Co.), a Seattle / Puget Sound real estate
photo, film and drone videographer. Live at https://hobbsmediaco.com. Next.js
App Router, TypeScript, Tailwind, Vercel. Design source of truth is
`docs/designs/hobbs-media-portfolio.md` (the amendment sections override the
body); the token sheet lives in `DESIGN.md`; the technical reference is
`docs/developing.md`.

## Working with Sam

Sam owns this site and is not a developer. When the person you are working
with is Sam (or anyone who isn't asking in developer terms), follow these:

- Plain English. No jargon in replies beyond the words defined in the
  README's glossary (repository, pull request, merge, preview, publish,
  build). Say what changed on the site, not which file.
- Every change goes through a branch and a pull request. Never commit to
  `main` directly. The Vercel bot posts a preview URL on the pull request
  within a few minutes; give Sam that link and ask him to check it on his
  phone before merging.
- Merging to `main` does not publish. Production is the `live` branch.
  Publish only when Sam explicitly asks ("publish", "go live", "put it on the
  site"): `git push origin main:live`, then confirm https://hobbsmediaco.com
  shows the change. Never publish on your own initiative.
- Run `npm run guard` and `npm test` before opening the pull request. If the
  guard refuses something (a line over its limit, a missing clip), explain the
  limit in one sentence and offer the nearest thing that fits.
- Sam is the approver. A clip he adds is `approved: true`; a fact he states is
  a plain value, not a `todo()`. If he asks for something that needs Jonny
  (layout, colors, playback behaviour, calling cards, adding an Instagram line
  or stats row for the first time), say so and stop.

### Recipes

**Change text.** Edit the string in `content/site.ts` (headlines, about,
contact, plaque) or `content/work.ts` (clip title and subtitle). Plaque lines
are 32 characters or fewer; work titles 28 or fewer. Do not change the
service short forms (`PHOTO`, `FILM`, `AERIAL`) or the vocabulary keys.

**Reorder, remove, or swap the hero.** `content/work.ts` is the stack, top to
bottom. Removing a clip means deleting its `work.ts` entry, its
`clips/manifest.json` entry, and running `npm run encode` to prune the files.
The hero is `heroClip` in `content/site.ts`; a hero clip needs `hero: true`
and a `focal` in the manifest.

**Add a video from a Google Drive link.**
1. Extract the file id from the share URL. Download into `clips/source/`
   (gitignored) with a descriptive kebab-case name:
   `pipx run gdown "https://drive.google.com/uc?id=FILE_ID" -O clips/source/<id>.mov`
   (or `curl -L "https://drive.google.com/uc?export=download&id=FILE_ID&confirm=t" -o ...`
   for files under about 100 MB). If the download is an HTML page, the link
   is not shared as "anyone with the link"; ask Sam to fix the sharing.
2. `ffprobe` it for duration and resolution. Build a contact sheet if Sam's
   in/out seconds are approximate (one frame every second or two, with the
   timestamp drawn on each) and pick a clean 6 to 12 s window: no gimbal
   tilts, no exposure jumps. Read `docs/developing.md` for the manifest
   fields; default to `loop: "xfade"`, `speed: 1`, `ratio: "16:9"`,
   `approved: true`, `hero: false`, and a `focal` on the subject.
3. Add the manifest entry and a `content/work.ts` entry in the position Sam
   asked for. `npm run encode` (ffmpeg required: `brew install ffmpeg` on a
   Mac, `apt-get install -y ffmpeg` in a Linux sandbox). Look at the poster
   `public/clips/<id>.<hash>.jpg` and the phone crop
   `clips/preview/<id>.<hash>.preview-916.jpg`; adjust `focal` if the subject
   is cut off.
4. `npm run guard`, `npm test`, commit `clips/manifest.json`,
   `clips/sidecars/`, `public/clips/`, `content/clips.generated.ts`,
   `content/work.ts`. Open the pull request and hand Sam the preview link.
   Tell him which seconds you used and offer the boomerang loop or a
   different window if it reads wrong.

**Undo.** Every merge is a squash commit on `main`; `git revert <sha>` on a
branch, pull request, merge, publish. Tell Sam what was undone in site terms.

## Design System

Always read DESIGN.md before making any visual or UI decisions. All font
choices, colors, spacing, and aesthetic direction are defined there. Do not
deviate without explicit user approval. In QA mode, flag any code that
doesn't match DESIGN.md.

## Facts and placeholders

Every fact on the site was confirmed by Sam on 2026-09-23/24. A new fact that
Sam has not stated goes in as `todo(label, value)` from `content/todo.ts`; the
guard lists todos and refuses a live build while any remain. `instagram` is
`null` on purpose (no handle); `stats` is empty on purpose (no invented
numbers). Do not invent a founding year, a client count, or a handle.

## Layout and commands

- Routes are explicit per theme under `app/<theme>/` (`page.tsx`, `for/[agent]`,
  `p/[slug]`, each with an `opengraph-image.tsx`). Those files only bind the
  theme to the factories in `site/page.tsx` and `site/og.tsx`; put shared
  behaviour there, not in `app/`. Next.js forbids OG images under an optional
  catch-all, so do not collapse the themes into a dynamic segment.
- `launchTheme` is `dark` (`content/config.ts`): `href()` emits theme-less
  paths, `next.config.ts` serves `/` from `/dark` and 301s `/dark/*`; at
  `SITE_STAGE=live` the other themes and the sample calling cards 404
  (`retiredAtLive` in `site/routes.ts`).
- Content lives in `content/`; playback in `lib/` (`VideoBudget.ts`,
  `playbackPolicy.ts`, `heroIsland.ts`); the footage pipeline is
  `scripts/encode.ts` with sidecars in `clips/sidecars/` (never under `public/`).
  Never hand-edit `content/clips.generated.ts` or `public/clips/`; run
  `npm run encode`. Never use `loop: "none"` for a clip that will be on screen
  for more than its length (it reads as frozen on a phone).
- Node 20.12+. `npm test` (Vitest, needs ffmpeg on PATH); `npm run build` then
  `npm run test:e2e` (Playwright: iPhone 14 WebKit and desktop Google Chrome via
  `channel: "chrome"`); `npm run guard`; `npm run typecheck`; `npm run lint`.
- The prebuild guard fails closed at every stage on over-limit plaque strings
  and content integrity (manifest/index disagreement, missing clip files,
  duplicate slugs, dangling references); at `live` it also needs every
  `todo()` resolved, every clip approved, `launchTheme` set, and an https
  `SITE_URL`.
- Hosting: Sam's Vercel account, connected to this repo. Production branch
  `live`; `main` and pull requests build previews. No CLI deploys.
- Where things are documented: `README.md` (Sam's guide), `docs/developing.md`
  (technical reference), `docs/test-map.md` (which test covers which failure
  mode), `TODOS.md` (deferred work), `CHANGELOG.md` (release notes).
