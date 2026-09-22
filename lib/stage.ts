/**
 * SITE_STAGE is the one switch between review and launch (eng 7A, T1, 6A).
 * It must be exactly "review" or "live"; anything else fails closed.
 */

export type SiteStage = "review" | "live";

export class StageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StageError";
  }
}

export type StageEnv = Record<string, string | undefined>;

export function resolveStage(env: StageEnv = process.env): SiteStage {
  const raw = env.SITE_STAGE;
  if (raw !== "review" && raw !== "live") {
    throw new StageError(
      `SITE_STAGE must be exactly "review" or "live" (got ${raw === undefined ? "nothing" : JSON.stringify(raw)}). See .env.example.`,
    );
  }
  if (env.VERCEL_ENV === "production" && raw !== "live") {
    throw new StageError(`VERCEL_ENV=production requires SITE_STAGE=live (got "${raw}"). Production never ships the review build.`);
  }
  return raw;
}

/** Non-throwing read for render paths; the prebuild guard has already validated it. */
export function stage(): SiteStage {
  return process.env.SITE_STAGE === "live" ? "live" : "review";
}

export function isReview(): boolean {
  return stage() === "review";
}
