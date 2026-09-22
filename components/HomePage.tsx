import { Wordmark } from "@/components/Wordmark";
import type { ThemeId } from "@/content/themes";

/** Scaffold placeholder; replaced by the hero and sections. */
export function HomePage({ theme }: { theme: ThemeId }) {
  return (
    <main className="min-h-svh content section">
      <Wordmark theme={theme} size="hero" />
    </main>
  );
}
