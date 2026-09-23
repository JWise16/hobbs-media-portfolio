"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { contactLinks, copy } from "@/content/site";
import { themes, type ThemeId } from "@/content/themes";
import { scrollDim } from "@/lib/scrollDim";

/**
 * Sticky header (design 3A, 18A). Cinematic themes: hidden until scroll
 * progress reaches 1, then fades in over 200ms; wordmark 18px left, one
 * tracked link TEXT SAM right, surface at 92%, 56px, no border, no hamburger.
 * `hobbs`: static from the top over the still hero, sticky at 56px after it.
 */
export function Header({ theme, mode }: { theme: ThemeId; mode?: "on-progress" | "static-then-sticky" }) {
  const m = mode ?? themes[theme].header;
  const [visible, setVisible] = useState(m !== "on-progress");
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (m === "on-progress") {
      const dim = scrollDim();
      dim.start();
      return dim.subscribe((s) => setVisible(s.progress >= 1));
    }
    // static-then-sticky: the dim store stops publishing once progress
    // saturates at 0.6svh, so the past-hero flip listens to raw scroll.
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 56;
    let raf = 0;
    const measure = () => {
      raf = 0;
      setPastHero(window.scrollY >= window.innerHeight - headerH);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    measure();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [m]);

  return (
    <header className="site-header" data-mode={m} data-visible={visible ? "1" : "0"} data-past-hero={pastHero ? "1" : "0"}>
      <div className="site-header-inner">
        <Wordmark theme={theme} size="header" />
        <a className="tracked tap site-header-link" href={contactLinks.sms()}>
          {copy.contact.textSam}
        </a>
      </div>
    </header>
  );
}
