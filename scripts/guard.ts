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
import type { TodoEntry } from "../content/todo";
import type { LimitViolation } from "../lib/plaque";
import { resolveStage, StageError, type SiteStage, type StageEnv } from "../lib/stage";
import { loadDotEnv } from "./env";
import { isMain } from "./isMain";

export interface GuardReport {
  stage: SiteStage;
  todos: TodoEntry[];
  unapprovedClips: string[];
  limitViolations: LimitViolation[];
  plaqueLimitViolations: LimitViolation[];
  /** Content problems that fail at every stage: dangling references, bad slugs, a stale generated index. */
  integrity: string[];
  /** Live-only requirements (SITE_URL). */
  launch: string[];
  ok: boolean;
  lines: string[];
}

export type GuardEnv = StageEnv;

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Evaluates every rule against the content modules (imported once per
 * process; tests that need different content mock the modules). Exported for tests.
 */
export async function runGuard(env: GuardEnv = process.env): Promise<GuardReport> {
  const stage = resolveStage(env);

  const [{ todos }, site, { agents }, { properties }, { work }, { clips }, plaque, manifestModule] = await Promise.all([
    import("../content/todo"),
    import("../content/site"),
    import("../content/agents"),
    import("../content/properties"),
    import("../content/work"),
    import("../content/clips.generated"),
    import("../lib/plaque"),
    import("../clips/manifest.json"),
  ]);
  const index = clips as Record<string, { approved: boolean }>;
  const manifest = (manifestModule as { default?: { clips: Array<{ id: string; approved?: boolean }> } }).default ?? (manifestModule as { clips: Array<{ id: string; approved?: boolean }> });

  const referenced = new Set<string>([site.heroClip]);
  for (const w of work) if ("clip" in w.media) referenced.add(w.media.clip);
  for (const p of properties) if (p.reel) referenced.add(p.reel);
  const unapprovedClips = [...referenced].filter((id) => !index[id]?.approved);

  const integrity: string[] = [];
  // The generated index is what the site reads; if it disagrees with the
  // manifest, `npm run encode` was skipped after an edit.
  const manifestIds = new Set(manifest.clips.map((c) => c.id));
  for (const id of Object.keys(index)) if (!manifestIds.has(id)) integrity.push(`clips.generated.ts has "${id}" but clips/manifest.json does not: run npm run encode`);
  for (const c of manifest.clips) {
    if (!index[c.id]) integrity.push(`clips/manifest.json has "${c.id}" but clips.generated.ts does not: run npm run encode`);
    else if (Boolean(c.approved) !== index[c.id].approved) integrity.push(`"${c.id}" approved=${Boolean(c.approved)} in the manifest but ${index[c.id].approved} in the index: run npm run encode`);
  }
  for (const id of referenced) if (!index[id]) integrity.push(`referenced clip "${id}" is not in clips.generated.ts`);
  const agentSlugs = new Set(agents.map((a) => a.slug));
  for (const a of agents) if (!SLUG_RE.test(a.slug)) integrity.push(`agents[${a.slug}]: slug must be lowercase kebab-case`);
  for (const p of properties) {
    if (!SLUG_RE.test(p.slug)) integrity.push(`properties[${p.slug}]: slug must be lowercase kebab-case`);
    if (p.agent && !agentSlugs.has(p.agent)) integrity.push(`properties[${p.slug}].agent "${p.agent}" does not match any agent slug`);
  }

  const launch: string[] = [];
  if (stage === "live") {
    const url = env.SITE_URL;
    let parsed = false;
    try {
      parsed = !!url && new URL(url).protocol === "https:";
    } catch {
      parsed = false;
    }
    if (!parsed) launch.push(`SITE_URL must be an absolute https URL at SITE_STAGE=live (got ${url === undefined ? "nothing" : JSON.stringify(url)}); og:image links depend on it`);
  }

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

  if (integrity.length) {
    lines.push("");
    lines.push("Content integrity:");
    for (const m of integrity) lines.push(`  ${m}`);
  }
  if (launch.length) {
    lines.push("");
    lines.push("Launch requirements:");
    for (const m of launch) lines.push(`  ${m}`);
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
  const integrityOk = integrity.length === 0;
  const liveOk = stage === "review" || (todoList.length === 0 && unapprovedClips.length === 0 && launch.length === 0);
  const ok = limitsOk && integrityOk && liveOk;

  lines.push("");
  if (!limitsOk) lines.push("FAIL: shorten the strings above.");
  if (!integrityOk) lines.push("FAIL: fix the content integrity problems above.");
  if (!liveOk) lines.push("FAIL: SITE_STAGE=live refuses to ship while any unconfirmed fact, unapproved clip, or launch requirement remains.");
  if (ok) lines.push(stage === "live" ? "OK: nothing unconfirmed, every referenced clip approved." : "OK for review: placeholders are allowed.");

  return { stage, todos: todoList, unapprovedClips, limitViolations, plaqueLimitViolations, integrity, launch, ok, lines };
}

if (isMain(import.meta.url)) {
  loadDotEnv();
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
