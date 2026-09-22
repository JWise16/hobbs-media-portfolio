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
 * `always` (calling-card beat two, 404): visible from the start.
 */
export function Header({ theme, mode }: { theme: ThemeId; mode?: "on-progress" | "static-then-sticky" | "always" }) {
  const m = mode ?? themes[theme].header;
  const [visible, setVisible] = useState(m !== "on-progress");
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (m === "always") return;
    const dim = scrollDim();
    dim.start();
    return dim.subscribe((s) => {
      if (m === "on-progress") setVisible(s.progress >= 1);
      setPastHero(window.scrollY >= window.innerHeight - 56);
    });
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
