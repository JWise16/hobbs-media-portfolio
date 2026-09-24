import type { ClipId } from "./clips.generated";
import { serviceOrder, vocabulary, type ServiceKey } from "./vocabulary";

/**
 * Brand, contact, plaque and section copy. Every fact Sam has not confirmed
 * is wrapped in todo(label, value); the guard lists them all and refuses a
 * live build while any remain. The business name and the wordmark are confirmed.
 */

export const brand = {
  name: "Hobbs Media Co.",
  /** Two-tone wordmark: `word` in text color, `rest` in the muted/"Media Co." token. */
  wordmark: { word: "Hobbs", rest: "Media Co." },
  /** Sam's first name for TEXT SAM / EMAIL SAM. */
  firstName: "Sam",
  description: "Real estate photo, film and aerial for Seattle and Puget Sound listings.",
} as const;

/** The home hero and every share link play this unless a property overrides it. */
export const heroClip: ClipId = "needle-above-clouds";

/** Optional Sam-supplied photo for the `hobbs` still hero; falls back to the hero clip's 1920 poster. */
export const heroImage: string | null = null;

export const contact = {
  /** E.164 for sms:/tel: links. */
  phoneE164: "+12067904352", // confirmed by Jonny 2026-09-23
  phoneDisplay: "(206) 790-4352",
  email: "hobbsmediaco.sea@gmail.com", // confirmed by Sam 2026-09-24
  /** Sam's handle, once he gives one; null hides the Instagram line and link everywhere. */
  instagram: null as string | null,
  basedIn: "Seattle, WA", // approved by Sam 2026-09-23
  serving: "Puget Sound & beyond",
  /** Hours render only if Sam confirms them; null hides the row. */
  hours: null as string | null,
} as const;

export const contactLinks = {
  sms: () => `sms:${contact.phoneE164}`,
  tel: () => `tel:${contact.phoneE164}`,
  mailto: () => `mailto:${contact.email}`,
  instagram: () => (contact.instagram ? `https://instagram.com/${contact.instagram}` : null),
};

/**
 * Home plaque (design 10A). Each line ≤ 32 characters; the guard checks.
 * Line one is set without spaces around the middots: with 0.28em tracking the
 * dots read as spaced, and the spaced form is 33 characters.
 */
export const homePlaque: readonly [string, string, string] = [
  "REAL ESTATE PHOTO·FILM·AERIAL",
  "SEATTLE & PUGET SOUND", // approved by Sam 2026-09-23
  "FAA PART 107 CERTIFIED",
];

export interface Service {
  key: ServiceKey;
  title: string;
  description: string;
}

export const services: Service[] = serviceOrder.map((key) => ({
  key,
  title: vocabulary[key].long,
  // Approved by Sam 2026-09-23.
  description: {
    photography: "Thoughtful, high-end imagery that shows a property at its best.",
    videography: "Cinematic films that capture feeling, flow and the finer details.",
    drone: "Elevated perspectives that reveal location, scale and context.",
  }[key],
}));

/** Headlines carry facts; the hero owns the mood (design 9A). At most one mood line per page. */
export const copy = {
  whatIDo: {
    kicker: "What I do",
    headline: "Photography, property films and aerials.",
  },
  work: {
    kicker: "Selected work",
    headline: "Recent shoots.",
    /** "AERIAL WORK, PUGET SOUND" until property films land, then "SELECTED PROPERTY SHOOTS". */
    subline: "AERIAL WORK, PUGET SOUND",
  },
  about: {
    kicker: "About",
    headline: "Based in Seattle. Part 107. 24 to 48 hour turnaround.",
    paragraphs: [
      "Hobbs Media Co. is a one-person studio built around a simple idea: great media sells homes faster and for more. Every shoot is planned, shot and edited by me. No handoffs, no filler.",
      "I work with agents, builders and property owners across the region. Turnaround is 24 to 48 hours for photography, 3 to 5 days for full video.",
    ],
  },
  contact: {
    kicker: "Get in touch",
    headline: "Have a listing coming up?",
    sentence: "Send the address and target list date. I reply the same day with availability and a quote.",
    textSam: `Text ${brand.firstName}`,
    emailSam: `Email ${brand.firstName}`,
    facts: { basedIn: "Based in", serving: "Serving", instagram: "Instagram", hours: "Hours" },
  },
  hobbsHero: {
    kicker: "Real estate media · Seattle",
    headline: "Photography, property films and aerials for Seattle listings.",
    /** Sam's mood line from his Lovable site, moved to the subhead (9A). */
    mood: "Listings that move. Stories told in light.",
    viewWork: "View the work",
    requestQuote: "Request a quote",
  },
  footerLine: "Hobbs Media Co. · Real estate photo · Film · Aerial",
  notFound: {
    headline: "That link isn't live.",
    home: "Hobbs Media Co. home",
  },
  scrollCue: "Scroll",
  tapToPlay: "Tap to play",
  preparedFor: "Prepared for",
  selectedWork: "Selected work",
} as const;

export interface Stat {
  value: string;
  label: string;
  /** The stats row renders only when all three are confirmed (5A). */
  confirmed: boolean;
}

/**
 * Empty until Sam supplies real numbers (homes shot, average delivery, Part
 * 107). The row renders only with three confirmed stats; no invented figures.
 */
export const stats: Stat[] = [];

export const statsConfirmed = stats.length === 3 && stats.every((s) => s.confirmed);
