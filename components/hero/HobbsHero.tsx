import Image from "next/image";
import { copy, contactLinks, heroImage } from "@/content/site";
import type { ThemeId } from "@/content/themes";
import type { ClipEntry } from "@/lib/clips.types";
import { workHref } from "@/lib/href";

/**
 * Sam's Lovable hero rebuilt (the `hobbs` theme): a still (his photo, else
 * the hero clip's 1920 poster), tracked kicker, serif fact headline, the
 * mood line as the subhead (9A), two CTAs. Static header sits over it (18A).
 */
export function HobbsHero({ theme, clip }: { theme: ThemeId; clip: ClipEntry }) {
  const src = heroImage ?? clip.files.poster_1920 ?? clip.files.poster;
  return (
    <div className="hobbs-hero">
      <Image src={src} alt="" fill priority sizes="100vw" className="hobbs-hero-image" />
      <div className="hobbs-hero-scrim" aria-hidden="true" />
      <div className="content hobbs-hero-text">
        <p className="tracked kicker hobbs-hero-kicker">{copy.hobbsHero.kicker}</p>
        <h1 className="hobbs-hero-headline">{copy.hobbsHero.headline}</h1>
        <p className="hobbs-hero-mood">{copy.hobbsHero.mood}</p>
        <div className="hobbs-hero-ctas">
          <a className="btn btn-primary" href={workHref(theme)}>
            {copy.hobbsHero.viewWork} →
          </a>
          <a className="btn btn-secondary" href={contactLinks.sms()}>
            {copy.hobbsHero.requestQuote}
          </a>
        </div>
      </div>
    </div>
  );
}
