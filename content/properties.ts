import type { ClipId } from "./clips.generated";
import { isReview } from "../lib/stage";
import { todo } from "./todo";

/**
 * Properties with a /p/[slug] calling card. The route exists from day one and
 * ships publicly when the first property film lands. Address renders only if
 * present. Limits (design 17A): title ≤ 28, address ≤ 40.
 */
export interface Property {
  slug: string;
  title: string;
  subtitle: string;
  /** Overrides the site hero clip for this card. */
  reel?: ClipId;
  /** Agent slug the film was delivered for. */
  agent?: string;
  address?: string;
}

/** The sample card exists on the review links only; live has no properties until the first film lands. */
export const properties: Property[] = isReview()
  ? [
      {
        slug: "ocean-ave",
        title: todo("properties.ocean-ave.title", "1234 Ocean Ave"),
        subtitle: todo("properties.ocean-ave.subtitle", "Aerial film"),
        reel: "needle-above-clouds",
        agent: "jessica",
      },
    ]
  : [];

export function findProperty(slug: string): Property | undefined {
  return properties.find((p) => p.slug === slug);
}
