import type { ClipId } from "./clips.generated";
import { todo } from "./todo";
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
  phoneE164: todo("contact.phone", "+12065550142"),
  phoneDisplay: todo("contact.phoneDisplay", "(206) 555-0142"),
  email: todo("contact.email", "hello@hobbsmedia.co"),
  instagram: todo("contact.instagram", "hobbsmedia.co"),
  basedIn: todo("contact.basedIn", "Seattle, WA"),
  serving: todo("contact.serving", "Puget Sound & beyond"),
  /** Hours render only if Sam confirms them; null hides the row. */
  hours: null as string | null,
} as const;

export const contactLinks = {
  sms: () => `sms:${contact.phoneE164}`,
  tel: () => `tel:${contact.phoneE164}`,
  mailto: () => `mailto:${contact.email}`,
  instagram: () => `https://instagram.com/${contact.instagram}`,
};

/**
 * Home plaque (design 10A). Each line ≤ 32 characters; the guard checks.
 * Line one is set without spaces around the middots: with 0.28em tracking the
 * dots read as spaced, and the spaced form is 33 characters.
 */
export const homePlaque: readonly [string, string, string] = [
  "REAL ESTATE PHOTO·FILM·AERIAL",
  todo("plaque.area", "SEATTLE & PUGET SOUND"),
  todo("plaque.part107", "FAA PART 107 CERTIFIED"),
];

export interface Service {
  key: ServiceKey;
  title: string;
  description: string;
}

export const services: Service[] = serviceOrder.map((key) => ({
  key,
  title: vocabulary[key].long,
  description: todo(
    `services.${key}.description`,
    {
      photography: "Thoughtful, high-end imagery that shows a property at its best.",
      videography: "Cinematic films that capture feeling, flow and the finer details.",
      drone: "Elevated perspectives that reveal location, scale and context.",
    }[key],
  ),
}));

/** Headlines carry facts; the hero owns the mood (design 9A). At most one mood line per page. */
export const copy = {
  whatIDo: {
    kicker: "What I do",
    headline: todo("copy.whatIDo.headline", "Photography, property films and aerials."),
  },
  work: {
    kicker: "Selected work",
    headline: "Recent shoots.",
    /** "AERIAL WORK, PUGET SOUND" until property films land, then "SELECTED PROPERTY SHOOTS". */
    subline: todo("copy.work.subline", "AERIAL WORK, PUGET SOUND"),
  },
  about: {
    kicker: "About",
    headline: todo("copy.about.headline", "Based in Seattle. Part 107. 24 to 48 hour turnaround."),
    paragraphs: [
      todo(
        "copy.about.p1",
        "Hobbs Media Co. is a one-person studio built around a simple idea: great media sells homes faster and for more. Every shoot is planned, shot and edited by me. No handoffs, no filler.",
      ),
      todo(
        "copy.about.p2",
        "I work with agents, builders and property owners across the region. Turnaround is 24 to 48 hours for photography, 3 to 5 days for full video.",
      ),
    ],
  },
  contact: {
    kicker: "Get in touch",
    headline: "Have a listing coming up?",
    sentence: todo("copy.contact.sentence", "Send the address and target list date. I reply the same day with availability and a quote."),
    textSam: `Text ${brand.firstName}`,
    emailSam: `Email ${brand.firstName}`,
    facts: { basedIn: "Based in", serving: "Serving", instagram: "Instagram", hours: "Hours" },
  },
  hobbsHero: {
    kicker: todo("copy.hobbsHero.kicker", "Real estate media · Est. 2021"),
    headline: todo("copy.hobbsHero.headline", "Photography, property films and aerials for Seattle listings."),
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

export const stats: Stat[] = [
  { value: todo("stats.homes", "400+"), label: "Homes shot", confirmed: false },
  { value: todo("stats.delivery", "36h"), label: "Avg. delivery", confirmed: false },
  { value: todo("stats.part107", "Certified"), label: "FAA Part 107", confirmed: false },
];

export const statsConfirmed = stats.every((s) => s.confirmed);
