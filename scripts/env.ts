import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

/**
 * `tsx` does not load dotenv files the way `next` does. CLI entry points call
 * this so `.env.local` / `.env` values apply locally; a variable already set
 * in the shell always wins. Library code never calls it (tests pass env explicitly).
 */
export function loadDotEnv(cwd = process.cwd(), files = [".env.local", ".env"]): string[] {
  const applied: string[] = [];
  // util.parseEnv arrived in Node 20.12; engines requires it, but never crash a build over dotenv.
  if (typeof parseEnv !== "function") return applied;
  for (const name of files) {
    const file = path.join(cwd, name);
    if (!fs.existsSync(file)) continue;
    for (const [key, value] of Object.entries(parseEnv(fs.readFileSync(file, "utf8")))) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
        applied.push(key);
      }
    }
  }
  return applied;
}
