import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/hero/Hero";
import { HobbsHero } from "@/components/hero/HobbsHero";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { WhatIDo } from "@/components/sections/WhatIDo";
import { WorkStack } from "@/components/sections/WorkStack";
import { clips } from "@/content/clips.generated";
import { brand, heroClip, homePlaque } from "@/content/site";
import { themes, type ThemeId } from "@/content/themes";
import { homePlaqueLines } from "@/lib/plaque";

/**
 * Home: hero → dim-to-surface → what I do → selected work → about → get in
 * touch, in Sam's order. Every section is opaque in the theme surface (7A).
 * One <header>, one <main>, one <footer> per page (16A). Hero treatment is
 * the only structural difference between `hobbs` and the cinematic themes.
 */
export function HomePage({ theme }: { theme: ThemeId }) {
  const clip = clips[heroClip];
  const t = themes[theme];
  return (
    <>
      <Header theme={theme} />
      <main>
        {t.hero === "reel" ? (
          <Hero theme={theme} clip={clip} plaque={homePlaqueLines(homePlaque)} variant="home" title={`${brand.name} reel`} />
        ) : (
          <HobbsHero theme={theme} clip={clip} />
        )}
        <div className="sections">
          <WhatIDo theme={theme} />
          <WorkStack theme={theme} />
          <About theme={theme} />
          <Contact theme={theme} />
        </div>
      </main>
      <Footer onContactSurface />
    </>
  );
}
