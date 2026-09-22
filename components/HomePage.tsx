import { Header } from "@/components/Header";
import { Hero } from "@/components/hero/Hero";
import { WorkStack } from "@/components/sections/WorkStack";
import { clips } from "@/content/clips.generated";
import { brand, heroClip, homePlaque } from "@/content/site";
import type { ThemeId } from "@/content/themes";
import { homePlaqueLines } from "@/lib/plaque";

/**
 * Home: hero → dim-to-surface → what I do → selected work → about → get in touch.
 * One <header>, one <main>, one <footer> per page (16A).
 */
export function HomePage({ theme }: { theme: ThemeId }) {
  const clip = clips[heroClip];
  return (
    <>
      <Header theme={theme} />
      <main>
        <Hero theme={theme} clip={clip} plaque={homePlaqueLines(homePlaque)} variant="home" title={`${brand.name} reel`} />
        <div className="sections">
          <WorkStack theme={theme} />
        </div>
      </main>
      <footer className="content" style={{ paddingBlock: 24 }}>
        <p className="tracked tracked-xs body-muted text-center">{brand.name}</p>
      </footer>
    </>
  );
}
