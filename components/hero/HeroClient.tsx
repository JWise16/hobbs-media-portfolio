"use client";

import { useEffect, useRef } from "react";
import { applyDimVars, scrollDim } from "@/lib/scrollDim";
import { videoBudget } from "@/lib/VideoBudget";

export interface HeroClientProps {
  videoId: string;
  src720: string;
  src1080?: string;
  loop: boolean;
  /** home: the hero is sticky and measured by its flow position. card: the reel keeps looping under beat two. */
  variant: "home" | "card";
}

/**
 * Wires the raw-HTML island to the page controllers after hydration:
 * registers the video with the VideoBudget (client-nav init included),
 * feeds scroll-dim progress to the hero root's CSS variables, and makes the
 * frame tap/Space toggle playback (6B).
 */
export function HeroClient({ videoId, src720, src1080, loop, variant }: HeroClientProps) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const video = document.getElementById(videoId) as HTMLVideoElement | null;
    if (!video) return;
    const root = video.closest<HTMLElement>(".hero");
    const frame = root?.querySelector<HTMLElement>(".hero-frame") ?? null;
    const budget = videoBudget();
    const dim = scrollDim();

    const unregister = budget.register({
      el: video,
      kind: "hero",
      src720,
      src1080,
      loop,
      rect:
        variant === "home"
          ? () => {
              const top = -window.scrollY;
              return { top, bottom: top + window.innerHeight };
            }
          : undefined,
    });

    dim.start();
    const unsubscribe = dim.subscribe((s) => {
      if (root) applyDimVars(root, s);
      budget.setScrollProgress(variant === "home" ? s.progress : 0);
    });

    const onToggle = () => budget.toggle(video);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onToggle();
      }
    };
    frame?.addEventListener("click", onToggle);
    frame?.addEventListener("keydown", onKey);

    cleanupRef.current = () => {
      frame?.removeEventListener("click", onToggle);
      frame?.removeEventListener("keydown", onKey);
      unsubscribe();
      unregister();
    };
    return () => cleanupRef.current?.();
  }, [videoId, src720, src1080, loop, variant]);

  return null;
}
