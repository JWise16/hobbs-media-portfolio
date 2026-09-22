---
# gstack: design-md-format=spec
name: Hobbs Media Co.
description: Near-black surface, editorial serif, tracked caps; Sam's aerial footage carries the mood and the type stays out of its way.
colors:
  # Canonical values are the `dark` theme (the approved mockup reference).
  # All four themes are listed under `themes:` and live as CSS variables under [data-theme].
  surface: "#0B0D12"
  text: "#F3EFE6"
  text-muted: "#8C9BB0"
  hairline: "rgb(255 255 255 / 0.12)"
  button-fill: "#F3EFE6"
  button-text: "#0B0D12"
  hero-text: "#F3EFE6"
  overlay-tint: "rgb(20 30 50 / 0.25)"
  dim-target: "#0B0D12"
  pending-tag: "#C9A24A"
  pending-tag-bg: "rgb(0 0 0 / 0.6)"
themes:
  dark:
    surface: "#0B0D12"
    text: "#F3EFE6"
    muted: "#8C9BB0"
    hairline: "rgb(255 255 255 / 0.12)"
    button-fill: "#F3EFE6"
    button-text: "#0B0D12"
    hero-text: "#F3EFE6"
    overlay-tint: "rgb(20 30 50 / 0.25)"
    dim-target: "#0B0D12"
    accent: none
  light:
    surface: "#F5F1EA"
    text: "#2A2621"
    muted: "#7A736B"
    hairline: "rgb(42 38 33 / 0.12)"
    button-fill: "#2A2621"
    button-text: "#F5F1EA"
    hero-text: "#F3EFE6"
    overlay-tint: "rgb(245 241 234 / 0.10)"
    dim-target: "#F5F1EA"
    accent: none
  twilight:
    surface: "#12100E"
    text: "#EFE6D6"
    muted: "#A89880"
    hairline: "rgb(239 230 214 / 0.12)"
    button-fill: "#EFE6D6"
    button-text: "#12100E"
    hero-text: "#EFE6D6"
    overlay-tint: "rgb(40 24 8 / 0.22)"
    dim-target: "#12100E"
    accent: "#C9A24A"
  hobbs:
    surface: "#F7F4EE"
    text: "#141414"
    muted: "#7E8CA0"
    hairline: "rgb(20 20 20 / 0.12)"
    button-fill: "#141414"
    button-text: "#F7F4EE"
    hero-text: "#F3EFE6"
    overlay-tint: none
    dim-target: n/a
    accent: none
    contact-surface: "#111214"
typography:
  display:
    fontFamily: Instrument Serif
    fontWeight: 400
    fontSize: "clamp(40px, 15vw, 64px)"
    letterSpacing: 0em
  display-desktop:
    fontFamily: Instrument Serif
    fontWeight: 400
    fontSize: "clamp(64px, 7vw, 104px)"
  wordmark-card:
    fontFamily: Instrument Serif
    fontSize: 56px
  wordmark-header:
    fontFamily: Instrument Serif
    fontSize: 18px
  h2:
    fontFamily: Instrument Serif
    fontWeight: 400
    fontSize: 44px
    fontSizeDesktop: 64px
    lineHeight: 1.05
    letterSpacing: -0.01em
  stack-title:
    fontFamily: Instrument Serif
    fontSize: 28px
  stack-subtitle:
    fontSize: 11px
    letterSpacing: 0.2em
    textTransform: uppercase
  numeral-hobbs:
    fontFamily: Instrument Serif
    fontSize: 36px
  body:
    fontFamily: Satoshi
    fontFamilyHobbs: Manrope
    fontSize: 17px
    lineHeight: 1.55
    minimum: 16px
  plaque:
    fontSize: 11px
    fontSizeDesktop: 12px
    fontWeight: 500
    letterSpacing: 0.28em
    lineHeight: 2.1
    textTransform: uppercase
  kicker-hobbs:
    fontSize: 11px
    letterSpacing: 0.3em
    textTransform: uppercase
  label:
    fontSize: 10px
    letterSpacing: 0.2em
    textTransform: uppercase
  button:
    fontSize: 13px
    letterSpacing: 0.2em
    textTransform: uppercase
  scroll-cue:
    fontSize: 10px
    letterSpacing: 0.3em
    textTransform: uppercase
  mono:
    fontFeature: tnum
rounded:
  none: 0
  button: 2px
spacing:
  section-mobile: 96px
  section-desktop: 144px
  h2-above: 64px
  h2-below: 24px
  content-max: 1200px
  stack-gap-mobile: 12px
  stack-gap-desktop: 24px
  header-height: 56px
  button-height: 56px
  button-width-desktop: 320px
  tag-padding: 6px 12px
  touch-min: 44px
  scroll-cue-bottom: 24px
  contact-column-max: 480px
components:
  button-primary:
    backgroundColor: "{colors.button-fill}"
    textColor: "{colors.button-text}"
    rounded: "{rounded.button}"
    height: "{spacing.button-height}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.text}"
    borderColor: "{colors.text}"
    borderWidth: 1px
    rounded: "{rounded.button}"
    height: "{spacing.button-height}"
  tag-chip:
    borderWidth: 1px
    borderColor: "rgb(255 255 255 / 0.6)"
    textColor: "rgb(255 255 255 / 0.6)"
    rounded: "{rounded.none}"
    padding: "{spacing.tag-padding}"
  sticky-header:
    backgroundColor: "{colors.surface}"
    opacity: 0.92
    height: "{spacing.header-height}"
    fadeIn: 200ms
  focus-ring:
    outline: 2px solid
    outlineColor: "{colors.text}"
    outlineOffset: 2px
  selection:
    backgroundColor: "{colors.text-muted}"
    opacity: 0.3
  scrollbar-thumb:
    color: "{colors.text-muted}"
    opacity: 0.4
  pending-tag:
    textColor: "{colors.pending-tag}"
    backgroundColor: "{colors.pending-tag-bg}"
    fontSize: 10px
    letterSpacing: 0.2em
---

# Hobbs Media Co.

Promoted from the approved design doc (`docs/designs/hobbs-media-portfolio.md`,
design review amendments 12A, 13A, 14A, 16A, 2026-09-22). The values are the
token sheet as decided there. They are starting points, tuned by eye, never
renamed. When this file and the design doc disagree, the design doc's
amendment sections win and this file is the one that gets fixed.

## Overview

**Creative North Star:** the reel is the site. A single operator's aerial
footage plays full-bleed before any navigation; the type is an editorial
serif wordmark and a three-line tracked-caps plaque that stay out of its way.

**Product context:** portfolio and calling-card site for Sam (Hobbs Media
Co.), a Seattle / Puget Sound real estate photo, film, and drone videographer.
Primary viewer is a real estate agent on a phone, via a texted or forwarded
link. Desktop is second, still intentional.

**Mode per surface:**
- Home first viewport: Experience. Full-bleed reel, wordmark, plaque, scroll cue.
- Home below the fold: Marketing. What I do, selected work, about, get in touch.
- Calling card (`/for/[agent]`, `/p/[slug]`): Marketing. Reel, personalized plaque, contact.

**Reference:** cabanetortin.com (plaque pattern, full-bleed video); Sam's
Lovable site (section order, serif + tracked-caps system, cream / near-black;
this is the `hobbs` theme). Approved mockups in `docs/designs/mockups/`.

**Key characteristics:**
- Footage first. Nothing competes with the reel; text sits on scrims, not boxes.
- One display face everywhere: Instrument Serif, upright, weight 400.
- Two-tone wordmark in every theme: "Hobbs" in text, "Media Co." in muted.
- Tracked caps carry facts (plaque, labels, buttons); the serif carries names and headlines.
- No accent color except brass on "Media Co." in `twilight`. No glow, no gradient, no neon.

## Colors

**Strategy:** Restrained. Each theme is a surface, a text color, a muted color,
and a hairline. Buttons invert surface and text. The only accent in the whole
system is `twilight`'s brass on "Media Co.".

**Light or dark:** four themes ship as static route segments during review so
Sam can pick from live links. `dark` is the mockup reference. `light` is warm
cream and charcoal, never cold gray. `twilight` is a warm near-black with
cream type. `hobbs` is Sam's own cream and near-black with a dark contact
section. `prefers-color-scheme` pairs `dark` and `light` only.

| Theme | Surface | Text | Muted / "Media Co." | Hairline | Button fill / text | Hero text over footage | Overlay tint | Dim target | Accent |
|---|---|---|---|---|---|---|---|---|---|
| dark | #0B0D12 | #F3EFE6 | #8C9BB0 | rgb(255 255 255 / .12) | #F3EFE6 / #0B0D12 | #F3EFE6 | rgb(20 30 50 / .25) | #0B0D12 | none |
| light | #F5F1EA | #2A2621 | #7A736B | rgb(42 38 33 / .12) | #2A2621 / #F5F1EA | #F3EFE6 (footage dark) | rgb(245 241 234 / .10) | #F5F1EA | none |
| twilight | #12100E | #EFE6D6 | #A89880 | rgb(239 230 214 / .12) | #EFE6D6 / #12100E | #EFE6D6 | rgb(40 24 8 / .22) | #12100E | brass #C9A24A on "Media Co." only |
| hobbs | #F7F4EE | #141414 | #7E8CA0 | rgb(20 20 20 / .12) | #141414 / #F7F4EE | #F3EFE6 on his still | none | n/a | none; contact section on #111214 |

Rules:
- Tokens are CSS variables under `[data-theme]`. No literal colors in components.
- "Media Co." is a verified color at full opacity, never reduced alpha.
- The dim target is always the theme surface, never pure black. `light` fades to cream.
- Hero text over footage sits on scrims: a centered radial
  `radial-gradient(ellipse 60% 50% at 50% 50%, rgb(0 0 0 / .35), transparent)`
  plus a bottom gradient; stack titles sit on
  `linear-gradient(to top, rgb(0 0 0 / .6), transparent 45%)`.
- Contrast: 4.5:1 body, 3:1 plaque over scrim, asserted against the darkest
  and lightest hero posters.
- The review-only PENDING tag is #C9A24A on rgb(0 0 0 / .6). It never ships live.

## Typography

**Display:** Instrument Serif 400 (Google Fonts) in all four themes. Wordmark,
h2, calling-card name line, stack titles, and `hobbs` numerals. Upright, never
italic; the footage earns the editorial register, the type does not reach for it.

**Support:** Manrope (Google Fonts) for `hobbs`, matching Sam's Lovable build.
Satoshi (Fontshare) for the three cinematic themes, with Outfit as the fallback
only if the OG-image embedding license is unclear at launch. Body, plaque,
labels, buttons, facts.

**Loading:** one `next/font` module per theme, imported only by that theme's
layout branch. A page requests exactly its theme's two families. Wordmark uses
`font-display: block` so the mark never flashes a fallback over footage.

**Scale:**

| Role | Value |
|---|---|
| Wordmark | hero mobile clamp(40px, 15vw, 64px); desktop clamp(64px, 7vw, 104px); calling card 56px; header 18px |
| Plaque | 11px mobile / 12px desktop, tracking 0.28em, line-height 2.1, weight 500, color not alpha |
| Kicker (hobbs only) | 11px, tracking 0.3em, muted |
| h2 | 44px mobile / 64px desktop, line-height 1.05, tracking -0.01em |
| Stack title / subtitle | 28px serif / 11px tracked 0.2em |
| Body | 17px / 1.55; descriptions muted; never below 16px |
| Numerals (hobbs) | 36px serif, muted |
| Tag chip | 1px outline text at 60%, 10px tracked 0.2em, padding 6px 12px, radius 0 |
| Buttons | 56px tall, 13px tracked 0.2em, radius 2px, full width mobile / 320px desktop |
| Scroll cue | 10px tracked 0.3em + 16px chevron, 24px from bottom |

Tracked labels are set in `rem` so they scale at 200% zoom. Tabular numerals
on the phone number.

**Vocabulary** (`content/vocabulary.ts`): `photography` renders "Photography" /
`PHOTO`; `videography` renders "Property films" / `FILM`; `drone` renders
"Aerials" / `AERIAL`. Tracked-caps contexts use the short form; sentence
contexts the long form. Tag chips render the short form.

## Layout

- Content max width 1200px; body measure 65 to 75ch.
- Section padding 96px mobile / 144px desktop; h2 has 64px above and 24px below (more space above than below, always).
- Desktop (≥1024px): what I do in three columns (title, sentence; `hobbs` adds the numeral above); selected work single column, frames capped at 1200×675, titles over the frame as on mobile; about two columns (headline 5/12 left, copy and stats right); get in touch two columns (headline and sentence left, buttons and facts right at 480px max); header full width.
- Stack gap 12px mobile / 24px desktop.
- Hero is `100svh` sticky. The dim runs over the first 0.6svh of scroll as the first section slides up over it. No `200svh` container.
- Sticky header: 56px, surface at 92%, no border, no hamburger; appears at scroll progress 1 on cinematic themes, static from the top on `hobbs` and sticky after the hero.
- Facts row stacks to one column below 400px or when a value wraps.
- Cinematic themes have no kickers and no numerals; h2s stand alone. `hobbs` keeps kickers and numerals as Sam built them.

## Elevation & Depth

None. There are no shadows, no glows, no frosted panels. Depth comes from
the footage behind the scrim and the opaque section surface sliding over it.
Hairlines (`hairline` token, 1px) separate service rows and facts.

## Shapes

- Radius 0 on frames, tag chips, hairlines, the PENDING tag.
- Radius 2px on buttons. That is the only rounded corner in the system.
- The tap-to-play affordance is a 44px outlined circle with a play glyph and "TAP TO PLAY" at 11px tracked; it disappears on first frame.

## Components

- **Wordmark:** two-tone, display face. Hero centered above the plaque on cinematic themes; top-left in `hobbs`. Focusable link to home.
- **Plaque:** three tracked-caps lines, each ≤ 32 characters (guard). Home: `REAL ESTATE PHOTO · FILM · AERIAL` / `SEATTLE & PUGET SOUND` / `FAA PART 107 CERTIFIED`. `/for/`: `PREPARED FOR {DISPLAYNAME}` / `{BROKERAGE}` / `{PHONE}` as a `tel:` link at 44px tap height. `/p/`: `{PROPERTY TITLE}` / `PREPARED FOR {DISPLAYNAME}` / `{PHONE}`.
- **Buttons:** filled primary (`button-fill` / `button-text`), 1px outline secondary. 56px tall. Hover: none beyond cursor; focus-visible: the focus ring; active: opacity .85; no disabled or loading state exists.
- **Tag chip:** short vocabulary form, outlined at 60%.
- **Stack frame:** 16/9 box in the surface color before the poster arrives; title, subtitle, and tag render immediately; poster lazy. `tabindex=0`, Space toggles, tap pauses and shows the affordance. No progress hairline, no pause glyph.
- **Sticky header:** wordmark 18px left, one tracked link `TEXT SAM` right. Fades in 200ms.
- **Facts:** label (tracked caps, muted) over value (body). Phone as `tel:` text, email as text, on every surface.
- **404:** wordmark, "That link isn't live.", `TEXT SAM`, home link.
- **Focus ring:** 2px solid text, offset 2px, never removed. Selection: muted at 30%. Scrollbar thin, thumb muted at 40%. Caret: text.

## Do's and Don'ts

- Do: read colors from `var(--...)` tokens; a grep for literal hex in `components/` returns nothing.
- Do: keep every tappable element ≥ 44px on its shortest side.
- Do: put one `<header>`, one `<main>`, `<section aria-labelledby>`, one `<footer>` on every page.
- Do: give decorative videos `aria-hidden` and the frame the clip title as its accessible name.
- Do: keep at most one mood line per page; headlines carry facts.
- Don't: add a neon accent, glow, gradient text, or a radial halo behind the hero.
- Don't: reduce "Media Co." with alpha; use the muted token.
- Don't: use the `autoplay` attribute anywhere; playback is scripted.
- Don't: add kickers or numerals to cinematic themes.
- Don't: introduce a hamburger, a lightbox, a contact form, or a motion toggle.

## Motion

- **Approach:** intentional. One authored moment; everything else is a fade.
- **Easing:** dim uses ease-out cubic; header fade-in is linear 200ms.
- **Duration:** dim tracks scroll progress over 0.6svh, not time; header 200ms; affordance appears instantly.
- **The one authored moment:** the scroll dim. Overlay 0 → 0.86 in the theme surface over the first 0.6svh; the mark translates -24px; the plaque fades before the mark; the scroll cue fades over progress 0 to 0.2. On share links the reel ghosts through at 0.86 and keeps looping under contact. On the home page the sections are opaque.
- `prefers-reduced-motion`: poster only, no dim, sections in normal flow, stack shows posters.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-22 | Token sheet promoted from design review 13A into DESIGN.md | /design-consultation run on the approved doc; nothing invented, tokens decided in review |
| 2026-09-22 | Instrument Serif display in all four themes (12A) | Overrides eng-review 10A; Sam's serif and the cinematic mockups share one voice |
| 2026-09-22 | No accent except brass on "Media Co." in twilight | Footage is the color; an accent would fight it |
