import type { ClipId } from "./clips.generated";
import { todo } from "./todo";
import type { ServiceKey } from "./vocabulary";

/**
 * Selected work, in Sam's layout: serif title, tracked subtitle, outlined tag.
 * Clip entries reference the manifest by id; photography entries use `image`
 * (public/work/*) and render as a static frame. No photos exist yet.
 * Titles are placeholders until Sam names the shoots.
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
    slug: "needle-above-clouds",
    title: todo("work.needle-above-clouds.title", "Above the Fog"),
    subtitle: todo("work.needle-above-clouds.subtitle", "Aerial film · Seattle"),
    tag: "drone",
    media: { clip: "needle-above-clouds" },
  },
  {
    slug: "marina-skyline",
    title: todo("work.marina-skyline.title", "Marina at Dusk"),
    subtitle: todo("work.marina-skyline.subtitle", "Aerial film · Shilshole"),
    tag: "drone",
    media: { clip: "marina-skyline" },
  },
  {
    slug: "yacht-dusk-side",
    title: todo("work.yacht-dusk-side.title", "Evening Run"),
    subtitle: todo("work.yacht-dusk-side.subtitle", "Aerial film · Puget Sound"),
    tag: "drone",
    media: { clip: "yacht-dusk-side" },
  },
  {
    slug: "point-sunset",
    title: todo("work.point-sunset.title", "The Point at Sunset"),
    subtitle: todo("work.point-sunset.subtitle", "Aerial film · Discovery Park"),
    tag: "drone",
    media: { clip: "point-sunset" },
  },
  {
    slug: "city-rise",
    title: todo("work.city-rise.title", "Queen Anne to the Needle"),
    subtitle: todo("work.city-rise.subtitle", "Aerial film · Seattle"),
    tag: "drone",
    media: { clip: "city-rise" },
  },
  {
    slug: "spit-golden-hour",
    title: todo("work.spit-golden-hour.title", "Golden Hour on the Spit"),
    subtitle: todo("work.spit-golden-hour.subtitle", "Aerial film · Puget Sound"),
    tag: "drone",
    media: { clip: "spit-golden-hour" },
  },
  {
    slug: "tug-daylight",
    title: todo("work.tug-daylight.title", "Working Water"),
    subtitle: todo("work.tug-daylight.subtitle", "Aerial film · Puget Sound"),
    tag: "drone",
    media: { clip: "tug-daylight" },
  },
];
