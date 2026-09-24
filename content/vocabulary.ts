
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
  // Long forms approved by Sam 2026-09-23.
  photography: { long: "Photography", short: "PHOTO" },
  videography: { long: "Property films", short: "FILM" },
  drone: { long: "Aerials", short: "AERIAL" },
};

export const serviceOrder: ServiceKey[] = ["photography", "videography", "drone"];
