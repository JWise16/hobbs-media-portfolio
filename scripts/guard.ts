/**
 * Prebuild guard (eng T1, T2, 6A; design 17A).
 *
 *   SITE_STAGE must be exactly "review" or "live"; VERCEL_ENV=production requires "live".
 *   Plaque and name limits are enforced at every stage; over-limit names the string.
 *   At "live": zero todo() labels and zero unapproved referenced clips, else print
 *   every one of them at once and exit 1. At "review": print the report and pass.
 *
 * Runs as `prebuild`, so `next build` on Vercel cannot skip it.
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { resolveStage, StageError, type SiteStage } from "../lib/stage";

export interface GuardReport {
  stage: SiteStage;
  todos: Array<{ label: string; value: string }>;
  unapprovedClips: string[];
  limitViolations: Array<{ what: string; value: string; length: number; limit: number }>;
  plaqueLimitViolations: Array<{ what: string; value: string; length: number; limit: number }>;
  ok: boolean;
  lines: string[];
}

export type GuardEnv = Record<string, string | undefined>;

/**
 * Loads content modules fresh so todo() registrations reflect the files on
 * disk, then evaluates every rule. Exported for tests.
 */
export async function runGuard(env: GuardEnv = process.env): Promise<GuardReport> {
  const stage = resolveStage(env);

  const [{ todos }, site, { agents }, { properties }, { work }, { clips }, plaque] = await Promise.all([
    import("../content/todo"),
    import("../content/site"),
    import("../content/agents"),
    import("../content/properties"),
    import("../content/work"),
    import("../content/clips.generated"),
    import("../lib/plaque"),
  ]);

  const referenced = new Set<string>([site.heroClip]);
  for (const w of work) if ("clip" in w.media) referenced.add(w.media.clip);
  for (const p of properties) if (p.reel) referenced.add(p.reel);
  const unapprovedClips = [...referenced].filter((id) => !(clips as Record<string, { approved: boolean }>)[id]?.approved);

  const limitViolations = [...agents.flatMap(plaque.checkAgentLimits), ...properties.flatMap(plaque.checkPropertyLimits)];

  const plaqueLimitViolations = [
    ...plaque.checkPlaqueLimits("home plaque", plaque.homePlaqueLines(site.homePlaque)),
    ...agents.flatMap((a) => plaque.checkPlaqueLimits(`/for/${a.slug} plaque`, plaque.agentPlaque(a, site.contact.phoneDisplay, site.contact.phoneE164))),
    ...properties.flatMap((p) =>
      plaque.checkPlaqueLimits(
        `/p/${p.slug} plaque`,
        plaque.propertyPlaque(
          p,
          agents.find((a) => a.slug === p.agent),
          site.contact.phoneDisplay,
          site.contact.phoneE164,
        ),
      ),
    ),
  ];

  const todoList = todos();
  const lines: string[] = [];
  lines.push(`SITE_STAGE=${stage}`);

  if (limitViolations.length || plaqueLimitViolations.length) {
    lines.push("");
    lines.push("Over-limit strings (design 17A):");
    for (const v of [...limitViolations, ...plaqueLimitViolations]) {
      lines.push(`  ${v.what}: "${v.value}" is ${v.length} characters (limit ${v.limit})`);
    }
  }

  lines.push("");
  if (todoList.length) {
    lines.push(`Unconfirmed facts (${todoList.length}):`);
    for (const t of todoList) lines.push(`  ${t.label} = ${JSON.stringify(t.value)}`);
  } else {
    lines.push("Unconfirmed facts: none");
  }

  lines.push("");
  if (unapprovedClips.length) {
    lines.push(`Unapproved clips referenced (${unapprovedClips.length}):`);
    for (const id of unapprovedClips) lines.push(`  ${id}`);
  } else {
    lines.push("Unapproved clips referenced: none");
  }

  const limitsOk = limitViolations.length === 0 && plaqueLimitViolations.length === 0;
  const liveOk = stage === "review" || (todoList.length === 0 && unapprovedClips.length === 0);
  const ok = limitsOk && liveOk;

  lines.push("");
  if (!limitsOk) lines.push("FAIL: shorten the strings above.");
  if (!liveOk) lines.push("FAIL: SITE_STAGE=live refuses to ship while any unconfirmed fact or unapproved clip remains.");
  if (ok) lines.push(stage === "live" ? "OK: nothing unconfirmed, every referenced clip approved." : "OK for review: placeholders are allowed.");

  return { stage, todos: todoList, unapprovedClips, limitViolations, plaqueLimitViolations, ok, lines };
}

const isMain = (() => {
  try {
    return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
  } catch {
    return false;
  }
})();

if (isMain) {
  runGuard()
    .then((r) => {
      console.log(r.lines.join("\n"));
      process.exit(r.ok ? 0 : 1);
    })
    .catch((err) => {
      if (err instanceof StageError) {
        console.error(`guard: ${err.message}`);
        process.exit(1);
      }
      console.error(err);
      process.exit(1);
    });
}
