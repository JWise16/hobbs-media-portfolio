import { renderHeroIsland, type HeroIslandOptions } from "@/lib/heroIsland";

/**
 * Server component. Emits the hero <video> and its inline script as raw HTML
 * so React never reconciles the subtree (eng 2A). HeroClient finds the video
 * by id and hands it to the VideoBudget.
 */
export function HeroIsland(props: HeroIslandOptions) {
  return <div className="hero-island" dangerouslySetInnerHTML={{ __html: renderHeroIsland(props) }} />;
}
