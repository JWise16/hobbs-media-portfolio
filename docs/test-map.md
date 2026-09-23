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
| encode: concurrent run, untrusted sidecar, CLI flags | `encode.test.ts` "refuses to run while another encode holds the lock", "ignores a sidecar that names another clip's files", "parses CLI flags" |
| encode: output missing with a matching sidecar, corrupt sidecar, probe failures | `encode.test.ts` "re-encodes when an output file is missing"; `test/unit/encode.edge.test.ts` |
| hero island: script blocked / no JS | `test/unit/heroIsland.test.ts` (server HTML has poster + 720 src, no autoplay); `test/e2e/hero.spec.ts` "no autoplay attribute" |
| hero island: escaping | `heroIsland.test.ts` "escapes ids, URLs and titles" |
| hero island: inline string and function in sync | `heroIsland.test.ts` "embeds the shared heroInit source verbatim", "runs as a standalone string" |
| hero island: client nav | `test/unit/VideoBudget.test.ts` "data-hero-init=0 runs heroInit"; `hero.spec.ts` "share → work → back" |
| hero: rung choice before first play | `heroIsland.test.ts` "picks 1080 on desktop"; `hero.spec.ts` "rung: 1080 on desktop, 720 on the phone" |
| hero: poster first | `hero.spec.ts` "poster is requested before the mp4" |
| hero: broken 1080 rung falls back to 720 | `heroIsland.test.ts` "a broken 1080 rung falls back to the 720 rung once"; `VideoBudget.test.ts` "a broken 1080 rung falls back to 720 once" |
| hero: poster landing after hydration must not restart a paused hero | `heroIsland.test.ts` "a poster that lands after the controller took over does not start playback" |
| VideoBudget: play() rejects | `heroIsland.test.ts` "play() rejection → blocked"; `VideoBudget.test.ts` "BLOCKED … a tap retries"; `test/e2e/budget.spec.ts` "blocked play() shows the tap affordance" |
| VideoBudget: two decoders | `test/unit/playbackPolicy.test.ts` "plays exactly one"; `budget.spec.ts` "exactly one video plays at five scroll positions" |
| VideoBudget: attach/release windows | `playbackPolicy.test.ts`, `VideoBudget.test.ts` "releases src beyond two viewports"; `budget.spec.ts` "src attached within one viewport and released beyond two" |
| VideoBudget: hero priority, covered hero pauses, re-attach | `playbackPolicy.test.ts` "hero wins while scroll progress < 1"; `VideoBudget.test.ts` "hero: priority…"; `budget.spec.ts` "scroll back to the top" |
| VideoBudget: visibilitychange | `VideoBudget.test.ts` "hidden tab pauses"; `budget.spec.ts` "hidden tab pauses everything" |
| VideoBudget: reduced motion | `playbackPolicy.test.ts`, `VideoBudget.test.ts` "reduced motion"; `test/e2e/reduced-motion.spec.ts` |
| VideoBudget: tap-to-pause, Space | `VideoBudget.test.ts` "tap-to-pause"; `budget.spec.ts` "tap-to-pause", "hero tap-to-pause" |
| VideoBudget: unmount | `VideoBudget.test.ts` "unregister on unmount" |
| VideoBudget: pause interrupting a pending play() (fast scroll) | `VideoBudget.test.ts` "a stale AbortError from an interrupting pause never marks the clip blocked"; `heroIsland.test.ts` "a stale AbortError from the load() after the fallback" |
| VideoBudget: blocked retry keeps one decoder; tapped clip keeps the slot | `VideoBudget.test.ts` "a gesture retry on a blocked clip pauses the current winner first"; `playbackPolicy.test.ts` "a tapped (pinned) clip wins" |
| VideoBudget: play-once holds the last frame; hidden tab pauses synchronously | `VideoBudget.test.ts` "a play-once clip that reaches its end holds the last frame", "a hidden tab pauses synchronously" |
| VideoBudget: destroy, sync play() throw, late settlement | `test/unit/VideoBudget.edge.test.ts` |
| clip 404 after poster | `VideoBudget.test.ts` "a video error after attach"; `hero.spec.ts` "hero video error after the poster" |
| OG route: build-time and runtime render | `test/e2e/routes.spec.ts` "OG routes return image/png"; `preview-public.spec.ts` (deployed) |
| OG route: fonts missing | `site/og.tsx` throws at build; `test/unit/site.test.ts` "readFont rejects with a named error when a file is missing"; covered by `next build` |
| route factories: noindex metadata, unknown slug 404, static params | `site.test.ts` "route factories"; `test/unit/content.test.ts` "static params cover every agent and property" |
| OG plaque line per route | `test/unit/content.test.ts` "OG plaque line" |
| Vercel Authentication on | `preview-public.spec.ts` |
| guard: SITE_STAGE typo, production ⇒ live | `test/unit/guard.test.ts` |
| guard: unapproved clip live, todo() report | `guard.test.ts` "live: refuses…"; `encode.test.ts` "refuses unapproved clips when SITE_STAGE=live" |
| guard: plaque/name limits | `test/unit/plaque.test.ts`; `test/unit/guard.mock.test.ts` "over-limit names, titles and composed plaque lines" |
| guard: manifest fails the schema; index disagrees with the manifest (ids, `approved`, edited entry) | `guard.mock.test.ts` "a generated index that disagrees with the manifest", "a manifest that fails the strict schema", "the guard and the encoder hash the manifest entry the same way"; `guard.test.ts` "the manifest, the generated index, the files on disk, and the agent references agree" |
| guard: clip files missing or empty under public/; unapproved clip still in the publication set at live | `guard.test.ts` "files named by the index must exist and be non-empty"; `guard.mock.test.ts` "live refuses an unapproved clip that is still in the publication set" |
| guard: duplicate or malformed slugs, dangling agent reference | `guard.mock.test.ts` "duplicate agent, property and work slugs", "a dangling agent reference is an integrity error" |
| guard: SITE_URL at live | `guard.test.ts` "live also requires an absolute SITE_URL"; `guard.mock.test.ts` "live with nothing unconfirmed, every clip approved, and SITE_URL set passes" |
| href(): theme segment in review, dropped for the launch theme | `content.test.ts` "prefixes the theme during review"; `test/unit/href.launch.test.ts` |
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
| Root redirect and noindex in review | `routes.spec.ts` "/ redirects to /dark during review", "every route is noindex in review" |
| Sticky header | `hero.spec.ts` "dim runs over 0.6svh, header appears at progress 1", "hobbs: header visible from the top" |

## Accessibility contract (16A)

`test/e2e/a11y.spec.ts`: axe on every route in both projects; landmarks;
44px targets; focus ring; frame names; body ≥ 16px; rem labels at 200% zoom;
facts stacking below 400px. `test/e2e/contrast.spec.ts`: 3:1 plaque and
4.5:1 body against the darkest and lightest posters with the real scrim math.
`test/e2e/fonts.spec.ts`: exactly two families per theme. `test/unit/contrast.test.ts`
checks the token pairs and the scrim math without a browser.
