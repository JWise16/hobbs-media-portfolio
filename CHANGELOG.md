# Changelog

All notable changes to the Hobbs Media Co. site. Versions are `MAJOR.MINOR.PATCH.MICRO`.

## [0.1.0.0] - 2026-09-22

### Added
- Four review themes at `/dark`, `/light`, `/twilight` and `/hobbs`, each a full home page in Sam's section order: reel hero, what I do, selected work, about, get in touch. The cinematic three share the full-bleed reel with the scroll dim; `hobbs` rebuilds Sam's Lovable design with the still hero, kickers and numerals.
- Calling cards at `/for/[agent]` and `/p/[slug]`: the reel with a personalised plaque whose third line is Sam's phone as a tap-to-call link, then a second beat with TEXT SAM, EMAIL SAM, details and one link to the work. Every card and home page renders its own OpenGraph image (poster, wordmark, plaque line) so a forwarded link previews in iMessage.
- Hero playback that starts before the wordmark is read: the poster is the first byte on the wire, the reel follows without an `autoplay` attribute, the 1080 rung is picked on desktop before the first byte of video, and a broken rung falls back to the smaller one. iOS Low Power Mode leaves the poster with a TAP TO PLAY affordance.
- Selected work as a vertical stack that plays one clip at a time as you scroll, with tap or Space to pause and no visible chrome. One page-level controller keeps iOS to a single decoder, releases clips more than two viewports away, pauses on a hidden tab, and honours reduced motion with posters only.
- The footage pipeline: `clips/manifest.json` in, hashed and immutable clips out (`npm run encode`), with sidecar hashing that skips unchanged clips, atomic writes, pruning of stale sets, a review-only 9:16 preview per clip, a native vertical path, and a typed index components read.
- A prebuild guard that fails closed: `SITE_STAGE` must be `review` or `live`, production requires `live`, and a live build refuses while any `todo()` fact, unapproved clip, over-limit plaque string, stale index or unreferenced file remains, listing all of them at once.
- The 13A token sheet as CSS variables per theme, Instrument Serif as the display face everywhere with Manrope (`hobbs`) or Satoshi (cinematic) as support, and exactly two font families per page.
- Accessibility contract: one header, main and footer per page, 44px targets, a focus ring that is never removed, labelled sections, frames with the clip title as their name, rem-scaled labels, contrast asserted over the darkest and lightest posters.
- Vitest units (encode runs against a real ffmpeg fixture) and Playwright on iPhone 14 WebKit and desktop Chrome plus reduced-motion variants, with axe on every route and a logged-out check against a deployed preview.

### Changed
- Routes are explicit per theme (`app/<theme>/…`) rather than one dynamic segment, because Next.js does not allow OpenGraph images under an optional catch-all.
- The home plaque's first line drops the spaces around its middots so it fits the 32-character limit; the tracking spaces them visually.

### Fixed
- Playback races found in review: a pause interrupting a pending `play()` no longer marks a clip blocked; a poster landing after hydration cannot restart a paused hero; a retry on a blocked clip keeps the one-decoder budget; a play-once clip holds its last frame; a hidden tab pauses without waiting for an animation frame.
- OpenGraph images no longer bundle every mp4 into their functions, and unknown slugs are 404s rather than on-demand renders.
- The `hobbs` header now switches to its sticky surface once the still hero scrolls away.
- Sidecars, which record source paths, moved out of `public/` so they are never served.
