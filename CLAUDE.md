# Hobbs Media Co. portfolio

Portfolio and calling-card site for Sam (Hobbs Media Co.), a Seattle / Puget
Sound real estate photo, film, and drone videographer. Next.js App Router,
TypeScript, Tailwind, Vercel. Design source of truth is
`docs/designs/hobbs-media-portfolio.md` (the amendment sections override the
body); the token sheet lives in `DESIGN.md`.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Facts are placeholders
Phone, email, Instagram, based-in / serving area, turnaround, stats, "reply
same day", and service long-form names are unconfirmed. They stay wrapped in
`todo(label, value)` until Sam confirms. `SITE_STAGE=live` fails the build
while any remain.

## Layout and commands
- Routes are explicit per theme under `app/<theme>/` (`page.tsx`, `for/[agent]`,
  `p/[slug]`, each with an `opengraph-image.tsx`). Those files only bind the
  theme to the factories in `site/page.tsx` and `site/og.tsx`; put shared
  behaviour there, not in `app/`. Next.js forbids OG images under an optional
  catch-all, so do not collapse the themes into a dynamic segment.
- Content lives in `content/`; playback in `lib/` (`VideoBudget.ts`,
  `playbackPolicy.ts`, `heroIsland.ts`); the footage pipeline is
  `scripts/encode.ts` with sidecars in `clips/sidecars/` (never under `public/`).
  Never hand-edit `content/clips.generated.ts` or `public/clips/`; run
  `npm run encode`.
- Node 20.12+. `npm test` (Vitest, needs ffmpeg on PATH); `npm run build` then
  `npm run test:e2e` (Playwright: iPhone 14 WebKit and desktop Google Chrome via
  `channel: "chrome"`); `npm run guard`; `npm run typecheck`; `npm run lint`.
- The prebuild guard fails closed at every stage on over-limit plaque strings
  and content integrity (manifest/index disagreement, missing clip files,
  duplicate slugs, dangling references); at `live` it also needs every
  `todo()` resolved, every clip approved, and an https `SITE_URL`.
- Where things are documented: `README.md` (workflows), `docs/test-map.md`
  (which test covers which failure mode), `TODOS.md` (deferred work),
  `CHANGELOG.md` (release notes).
