import type { ClipId } from "./clips.generated";
import { todo } from "./todo";
import type { ServiceKey } from "./vocabulary";

/**
 * Selected work, in Sam's layout: serif title, tracked subtitle, outlined tag.
 * Clip entries reference the manifest by id; photography entries use `image`
 * (public/work/*) and render as a static frame. No photos exist yet.
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
    slug: "dusk",
    title: todo("work.dusk.title", "Lakeside Modern"),
    subtitle: todo("work.dusk.subtitle", "Aerial film"),
    tag: "drone",
    media: { clip: "placeholder-dusk" },
  },
  {
    slug: "harbor",
    title: todo("work.harbor.title", "Harbor at Dusk"),
    subtitle: todo("work.harbor.subtitle", "Aerial film"),
    tag: "drone",
    media: { clip: "placeholder-harbor" },
  },
  {
    slug: "rise",
    title: todo("work.rise.title", "City Rise"),
    subtitle: todo("work.rise.subtitle", "Aerial film"),
    tag: "drone",
    media: { clip: "placeholder-rise" },
  },
  {
    slug: "sound",
    title: todo("work.sound.title", "Across the Sound"),
    subtitle: todo("work.sound.subtitle", "Aerial film"),
    tag: "drone",
    media: { clip: "placeholder-sound" },
  },
];
