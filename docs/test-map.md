# Test map

Where each codepath in the design doc's failure-modes table, the VideoBudget
state diagram, and the 5A state table is exercised.

## Failure modes

| Codepath | Test |
|---|---|
| encode: bad `out` | `test/unit/encode.test.ts` "rejects out past the source end" |
| encode: interrupted | `encode.test.ts` "leaves no partial file when ffmpeg fails mid-run" |
| encode: ffmpeg missing | `encode.test.ts` "names the Homebrew install line" |
| encode: ratio mismatch, loop too short, duplicate ids, focal required, unknown keys | `encode.test.ts` manifest validation block |
| encode: sidecar skip, prune, `--force`, approved flip does not re-encode | `encode.test.ts` "rerun is a no-op", "prunes the stale set", "removes outputs for clips dropped" |
| encode: native 9:16, preview-916 | `encode.test.ts` "native 9:16 source", "encodes all three loop modes" |
| hero island: script blocked / no JS | `test/unit/heroIsland.test.ts` (server HTML has poster + 720 src, no autoplay); `test/e2e/hero.spec.ts` "no autoplay attribute" |
| hero island: escaping | `heroIsland.test.ts` "escapes ids, URLs and titles" |
| hero island: inline string and function in sync | `heroIsland.test.ts` "embeds the shared heroInit source verbatim", "runs as a standalone string" |
| hero island: client nav | `test/unit/VideoBudget.test.ts` "data-hero-init=0 runs heroInit"; `hero.spec.ts` "share → work → back" |
| hero: rung choice before first play | `heroIsland.test.ts` "picks 1080 on desktop"; `hero.spec.ts` "rung: 1080 on desktop, 720 on the phone" |
| hero: poster first | `hero.spec.ts` "poster is requested before the mp4" |
| VideoBudget: play() rejects | `heroIsland.test.ts` "play() rejection → blocked"; `VideoBudget.test.ts` "BLOCKED … a tap retries"; `test/e2e/budget.spec.ts` "blocked play() shows the tap affordance" |
| VideoBudget: two decoders | `test/unit/playbackPolicy.test.ts` "plays exactly one"; `budget.spec.ts` "exactly one video plays at five scroll positions" |
| VideoBudget: attach/release windows | `playbackPolicy.test.ts`, `VideoBudget.test.ts` "releases src beyond two viewports"; `budget.spec.ts` "src attached within one viewport and released beyond two" |
| VideoBudget: hero priority, covered hero pauses, re-attach | `playbackPolicy.test.ts` "hero wins while scroll progress < 1"; `VideoBudget.test.ts` "hero: priority…"; `budget.spec.ts` "scroll back to the top" |
| VideoBudget: visibilitychange | `VideoBudget.test.ts` "hidden tab pauses"; `budget.spec.ts` "hidden tab pauses everything" |
| VideoBudget: reduced motion | `playbackPolicy.test.ts`, `VideoBudget.test.ts` "reduced motion"; `test/e2e/reduced-motion.spec.ts` |
| VideoBudget: tap-to-pause, Space | `VideoBudget.test.ts` "tap-to-pause"; `budget.spec.ts` "tap-to-pause", "hero tap-to-pause" |
| VideoBudget: unmount | `VideoBudget.test.ts` "unregister on unmount" |
| clip 404 after poster | `VideoBudget.test.ts` "a video error after attach"; `hero.spec.ts` "hero video error after the poster" |
| OG route: build-time and runtime render | `test/e2e/routes.spec.ts` "OG routes return image/png"; `preview-public.spec.ts` (deployed) |
| OG route: fonts missing | `site/og.tsx` throws at build; covered by `next build` |
| OG plaque line per route | `test/unit/content.test.ts` "OG plaque line" |
| Vercel Authentication on | `preview-public.spec.ts` |
| guard: SITE_STAGE typo, production ⇒ live | `test/unit/guard.test.ts` |
| guard: unapproved clip live, todo() report | `guard.test.ts` "live: refuses…"; `encode.test.ts` "refuses unapproved clips when SITE_STAGE=live" |
| guard: plaque/name limits | `test/unit/plaque.test.ts` |
| stale clip after swap | `encode.test.ts` "re-encodes on a content change with a new hash"; `routes.spec.ts` "clip outputs are hashed and immutable" |
| slow cellular / poster first, no spinner | `hero.spec.ts` "poster is requested before the mp4" |
| unknown /for/ slug | `routes.spec.ts` "unknown agent, property, and theme are 404s" |

## 5A state table

| Row | Test |
|---|---|
| Hero loading / success / partial (blocked) | `hero.spec.ts`, `budget.spec.ts` "blocked play()" |
| Hero error | `hero.spec.ts` "hero video error after the poster" |
| Selected work loading (16/9 box, lazy poster) | `budget.spec.ts` "posters visible before play" |
| Selected work partial (PENDING) | `routes.spec.ts` "selected work renders every entry" |
| About: stats row omitted | `routes.spec.ts` "stats row is omitted" |
| Contact: tel:/email text | `routes.spec.ts` "contact links" |
| Calling card empty (404) | `routes.spec.ts` "unknown agent…" |
| Calling card success (beat two) | `routes.spec.ts` "calling card: personalized plaque…" |
| Calling card reduced motion | `reduced-motion.spec.ts` "calling card" |
| Sticky header | `hero.spec.ts` "dim runs over 0.6svh, header appears at progress 1", "hobbs: header visible from the top" |

## Accessibility contract (16A)

`test/e2e/a11y.spec.ts`: axe on every route in both projects; landmarks;
44px targets; focus ring; frame names; body ≥ 16px; rem labels at 200% zoom;
facts stacking below 400px. `test/e2e/contrast.spec.ts`: 3:1 plaque and
4.5:1 body against the darkest and lightest posters with the real scrim math.
`test/e2e/fonts.spec.ts`: exactly two families per theme.
