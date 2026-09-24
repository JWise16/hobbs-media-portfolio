import type { ClipId } from "./clips.generated";
import type { ServiceKey } from "./vocabulary";

/**
 * Selected work, in Sam's layout: serif title, tracked subtitle, outlined tag.
 * Clip entries reference the manifest by id; photography entries use `image`
 * (public/work/*) and render as a static frame. No photos exist yet.
 * Order is Sam's (set 2026-09-24). Titles are placeholders until Sam
 * names the shoots. Titles and subtitles approved by Sam 2026-09-23.
 */
export type WorkMedia = { clip: ClipId } | { image: string; alt: string };

export interface WorkItem {
  slug: string;
  title: string;
  subtitle: string;
  tag: ServiceKey;
  media: WorkMedia;
}

export const work: WorkItem[] = [
  {
    slug: "sailboat-sunset",
    title: "Under Sail",
    subtitle: "Aerial film · Puget Sound",
    tag: "drone",
    media: { clip: "sailboat-sunset" },
  },
  {
    slug: "athens-acropolis",
    title: "The Acropolis",
    subtitle: "Aerial film · Athens",
    tag: "drone",
    media: { clip: "athens-acropolis" },
  },
  {
    slug: "city-rise",
    title: "Queen Anne to the Needle",
    subtitle: "Aerial film · Seattle",
    tag: "drone",
    media: { clip: "city-rise" },
  },
  {
    slug: "spit-golden-hour",
    title: "Golden Hour on the Spit",
    subtitle: "Aerial film · Discovery Park",
    tag: "drone",
    media: { clip: "spit-golden-hour" },
  },
  {
    slug: "yacht-dusk-wake",
    title: "Evening Run",
    subtitle: "Aerial film · Puget Sound",
    tag: "drone",
    media: { clip: "yacht-dusk-wake" },
  },
  {
    slug: "hilltop-tower",
    title: "Hilltop, Midday",
    subtitle: "Aerial film · Seattle",
    tag: "drone",
    media: { clip: "hilltop-tower" },
  },
  {
    slug: "tug-daylight",
    title: "Working Water",
    subtitle: "Aerial film · Puget Sound",
    tag: "drone",
    media: { clip: "tug-daylight" },
  },
];
