# TODOS

Planning-stage TODOs for the Hobbs Media Co. portfolio site. Move this file into
`JWise16/hobbs-media-portfolio` together with `docs/designs/hobbs-media-portfolio.md`.

## Hobbs Media portfolio

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

**Context:** Not in the design doc. Post-launch work; must not touch the four-link build. Vercel Web Analytics has a monthly event cap on Hobby and is paid beyond it; Plausible is paid from day one. Pick the product that follows the hosting decision (design doc open question 6). Spec is three lines: the provider component in the root layout and a `data-event` on the two contact links.

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

_(none yet)_
