import { Wordmark } from "@/components/Wordmark";
import type { Agent } from "@/content/agents";
import type { Property } from "@/content/properties";
import type { ThemeId } from "@/content/themes";

/** Scaffold placeholder; replaced by the two-beat calling card. */
export function CallingCard({ theme, agent, property }: { theme: ThemeId; agent?: Agent; property?: Property }) {
  return (
    <main className="min-h-svh content section">
      <Wordmark theme={theme} size="card" />
      <p>{property?.title ?? agent?.displayName}</p>
    </main>
  );
}
