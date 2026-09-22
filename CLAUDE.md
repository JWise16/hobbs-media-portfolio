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
