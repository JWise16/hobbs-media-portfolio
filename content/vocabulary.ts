import { todo } from "./todo";

/**
 * Service vocabulary (design 14A). Tracked-caps contexts use the short form;
 * sentence contexts the long form. Tag chips render the short form. Long
 * forms are Sam's to confirm, so they are todo().
 */
export type ServiceKey = "photography" | "videography" | "drone";

export interface ServiceWords {
  /** Sentence case, for headings and prose. */
  long: string;
  /** Tracked caps, for chips and labels. */
  short: string;
}

export const vocabulary: Record<ServiceKey, ServiceWords> = {
  photography: { long: todo("vocabulary.photography", "Photography"), short: "PHOTO" },
  videography: { long: todo("vocabulary.videography", "Property films"), short: "FILM" },
  drone: { long: todo("vocabulary.drone", "Aerials"), short: "AERIAL" },
};

export const serviceOrder: ServiceKey[] = ["photography", "videography", "drone"];
