import { isReview } from "../lib/stage";
import { todo } from "./todo";

/**
 * Agents who get a /for/[slug] calling card. Names come from Sam (open
 * question 4); the sample below is review-only and todo() until then.
 * Limits (design 17A): displayName ≤ 24, brokerage ≤ 20. The guard enforces them.
 */
export interface Agent {
  slug: string;
  displayName: string;
  brokerage?: string;
}

/** The sample card exists on the review links only; live has no agents until Sam names one. */
export const agents: Agent[] = isReview()
  ? [
      {
        slug: "jessica",
        displayName: todo("agents.jessica.displayName", "Jessica Tran"),
        brokerage: todo("agents.jessica.brokerage", "Windermere"),
      },
    ]
  : [];

export function findAgent(slug: string): Agent | undefined {
  return agents.find((a) => a.slug === slug);
}
