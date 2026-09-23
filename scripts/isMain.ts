import path from "node:path";
import { pathToFileURL } from "node:url";

/** True when the module at `url` is the script node was asked to run. */
export function isMain(url: string): boolean {
  try {
    return !!process.argv[1] && url === pathToFileURL(path.resolve(process.argv[1])).href;
  } catch {
    return false;
  }
}
