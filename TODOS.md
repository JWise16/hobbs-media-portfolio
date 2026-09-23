# TODOS

Planning-stage TODOs for the Hobbs Media Co. portfolio site. Moved into
`JWise16/hobbs-media-portfolio` together with `docs/designs/hobbs-media-portfolio.md`.

## Hobbs Media portfolio

### Real-phone check at the four-link milestone (T12)

**What:** Two iPhones, cold cellular load, Low Power Mode, background and resume, repeated scrolling; record first-frame time and bytes transferred before the reel plays against the targets (first frame under 1.5 s on LTE, under 4 MB).

**Why:** The only path that cannot be automated. Low Power Mode blocks even muted autoplay, and the tap affordance has been unit-tested with a mocked `play()` but never on a device.

**Context:** Deferred from the plan at ship time (2026-09-22): the review links play synthetic placeholder clips, and the numbers only mean something with Sam's footage encoded. Record results in `docs/designs/hobbs-media-portfolio.md`. Deferred from plan: docs/designs/hobbs-media-portfolio.md (T12).

**Effort:** S
**Priority:** P1
**Depends on:** Sam's footage encoded; two iPhones

### Bind the guard to `next build` itself

**What:** Run the SITE_STAGE / placeholder / approval guard from inside the Next build (a `next.config.ts` phase hook or an instrumentation entry) rather than only from the npm `prebuild` lifecycle.

**Why:** A Vercel build-command override of `next build`, or a switch to a package manager that does not run `pre` scripts, skips the guard entirely and a live build could ship placeholders. Raised by the outside (Codex) adversarial review at ship time.

**Context:** `scripts/guard.ts` is already a pure function (`runGuard`) that returns a report; the open question is whether importing content modules from `next.config.ts` is clean under Next 16's config compilation. Until then, keep the Vercel build command at its default (`npm run build`).

**Effort:** S
**Priority:** P2
**Depends on:** None

### Focal nudges should not re-encode

**What:** Exclude `focal` and `hero` from the encode content hash and regenerate only the review-only 9:16 preview when they change.

**Why:** `focal` affects only `object-position` and the preview crop, but today it is part of the hash, so every focal adjustment (the README's check-the-crop loop) re-encodes both rungs.

**Context:** The design doc hashes the whole entry JSON on purpose; this is a refinement of that rule, flagged by the adversarial review. The sidecar would need to record focal separately so the preview can be re-cut without ffmpeg re-encoding the loop.

**Effort:** S
**Priority:** P3
**Depends on:** None

### Test one /for/ calling card with one real agent

**What:** Sam sends a single personalized `/for/[agent]` card to one agent he trusts and asks: did you tap anything, and would you forward it.

**Why:** The referral-artifact thesis is the site's differentiator. Research shows agents value referrals; nothing yet shows they want a personalized microsite. Codex flagged it in the eng review (2026-09-21); the design was kept and the validation deferred here.

**Context:** After the four theme links exist and Sam has picked one, add one `agents[]` entry for a name Sam gives (design doc open question 4), send the link, and record the answer under Research in the design doc. If the agent scrolls past contact without tapping, revisit contact visibility in beat one via `/plan-design-review`.

**Effort:** S
**Priority:** P2
**Depends on:** theme picked; one confirmed agent name and phone from Sam

### Privacy-friendly analytics on link opens

**What:** Route-level pageviews plus one custom event on the `sms:` and `mailto:` links, via Vercel Web Analytics or Plausible.

**Why:** The texted link is the referral channel. Without a counter nobody knows if a `/for/jessica` link was opened or forwarded. Sam's first question after launch will be "did she open it?"

**Context:** Not in the design doc. Post-launch work; must not touch the four-link build. Vercel Web Analytics has a monthly event cap on Hobby and is paid beyond it; Plausible is paid from day one. Pick the product that follows the hosting decision (design doc open question 6). Spec is three lines: the provider component in the root layout and a `data-event` on the two contact links (the `data-event` attributes already exist on TEXT SAM and EMAIL SAM).

**Effort:** S
**Priority:** P3
**Depends on:** launch hosting decision; site live

### Prefilled text body on calling-card contact links

**What:** "Text Sam" on `/for/[agent]` and `/p/[slug]` opens Messages with a body like "Hi Sam, Jessica here about the Ocean Ave listing."

**Why:** Removes the blank-message moment that stops people from sending, and tells Sam which card produced the text.

**Context:** Pure content; agent and property data are already on the route. The `sms:` body syntax differs between iOS (`&body=`) and Android (`?body=`), so it needs a small helper next to `href()` with a user-agent branch and two unit tests. The plain `sms:+1...` link stays as the fallback when no context exists. Deferred from the eng review (2026-09-21) by Jonny's choice; the reviewer recommended building it with the route.

**Effort:** S
**Priority:** P3
**Depends on:** `/for/[agent]` route built; Sam's real phone number confirmed

## Completed

### Re-render the mobile hero mockup from a real 9:16 crop (D15)

**What:** Regenerate `docs/designs/mockups/variant-D.png` from the `clips/preview/<id>.<hash>.preview-916.jpg` crop of the chosen hero clip before the links go to Sam.

**Why:** The approved mockup shows an imagined composition; the site shows a real cover crop chosen by the manifest `focal`. Sam should see the crop the site will actually show.

**Context:** The encode script already emits the preview crop for every 16:9 clip. Deferred from plan: docs/designs/hobbs-media-portfolio.md (D15). Blocked on real footage.

**Effort:** S
**Priority:** P1
**Depends on:** Sam's footage encoded
**Completed:** v0.1.0.0 (2026-09-22): `docs/designs/mockups/variant-D.png` is now a screenshot of the `/dark` hero on an iPhone 14 viewport with the real sailboat crop.

