import { preload } from "react-dom";
import { HeroClient } from "@/components/hero/HeroClient";
import { HeroIsland } from "@/components/hero/HeroIsland";
import { Plaque } from "@/components/Plaque";
import { TapAffordance } from "@/components/TapAffordance";
import { Wordmark } from "@/components/Wordmark";
import { copy } from "@/content/site";
import type { ThemeId } from "@/content/themes";
import type { ClipEntry } from "@/lib/clips.types";
import { heroVideoId } from "@/lib/heroIsland";
import type { Plaque as PlaqueLines } from "@/lib/plaque";

export interface HeroProps {
  theme: ThemeId;
  clip: ClipEntry;
  plaque: PlaqueLines;
  /** home: full plaque, sticky with dim into the sections. card: two-beat calling card. */
  variant: "home" | "card";
  title: string;
}

/**
 * Cinematic hero (design 1A, 3A, 8A, 13A). 100svh sticky; the reel is a raw
 * HTML island; text sits on a radial scrim plus a bottom gradient; the dim
 * overlay is the theme surface, driven by --pe from the scroll-dim store.
 * No autoplay attribute anywhere; posters first.
 */
export function Hero({ theme, clip, plaque, variant, title }: HeroProps) {
  // 9A: the poster is the first byte on the wire, ahead of the video.
  preload(clip.files.poster, { as: "image", fetchPriority: "high" });

  const videoId = heroVideoId(clip.id);
  // 1A: on desktop the text block sits over the calm region the focal marks.
  const focalX = Math.min(0.7, Math.max(0.3, clip.focal.x));
  const style = { "--focal-x": `${Math.round(focalX * 100)}%` } as React.CSSProperties;

  return (
    <div className="hero" data-variant={variant} data-theme-hero={theme} style={style}>
      <noscript>
        <style>{`.hero{position:relative}.hero-dim,.hero-cue{display:none}`}</style>
      </noscript>
      <div className="hero-text">
        <h1 className="hero-mark">
          <Wordmark theme={theme} size={variant === "card" ? "card" : "hero"} onFootage />
        </h1>
        <Plaque lines={plaque} className="hero-plaque text-hero-text" />
      </div>
      <div className="hero-frame" role="button" tabIndex={0} aria-label={`Play or pause: ${title}`}>
        <div className="hero-media" aria-hidden="true">
          <HeroIsland
            id={clip.id}
            src720={clip.files.mp4_720}
            src1080={clip.files.mp4_1080}
            poster={clip.files.poster}
            focal={clip.focal}
            loop={clip.loop !== "none"}
            title={title}
          />
          <div className="hero-tint" />
          <div className="hero-scrim hero-scrim-radial" />
          <div className="hero-scrim hero-scrim-bottom" />
          <div className="hero-dim" />
        </div>
        <TapAffordance />
      </div>
      <div className="hero-cue" aria-hidden="true">
        <span className="tracked tracked-xs">{copy.scrollCue}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
          <path d="M2 5.5l6 6 6-6" />
        </svg>
      </div>
      <HeroClient videoId={videoId} src720={clip.files.mp4_720} src1080={clip.files.mp4_1080} loop={clip.loop !== "none"} variant={variant} />
    </div>
  );
}
