import Link from "next/link";
import { brand } from "@/content/site";
import type { ThemeId } from "@/content/themes";
import { homeHref } from "@/lib/href";

type Size = "hero" | "card" | "header";

const sizeClass: Record<Size, string> = {
  hero: "wordmark-hero",
  card: "wordmark-card",
  header: "wordmark-header",
};

/**
 * The wordmark is the mark (open question 3): "Hobbs" in the text color,
 * "Media Co." in the muted token (brass in twilight), display face, weight 400.
 * `onFootage` uses the hero text color so it holds over the reel.
 */
export function Wordmark({
  theme,
  size = "header",
  onFootage = false,
  asLink = true,
  className = "",
}: {
  theme: ThemeId;
  size?: Size;
  onFootage?: boolean;
  asLink?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      <span className={onFootage ? "text-hero-text" : "text-text"}>{brand.wordmark.word}</span>{" "}
      <span className="text-media-co">{brand.wordmark.rest}</span>
    </>
  );
  const cls = `wordmark ${sizeClass[size]} ${className}`.trim();
  if (!asLink) {
    return <span className={cls}>{inner}</span>;
  }
  return (
    <Link href={homeHref(theme)} className={`${cls} tap`} aria-label={`${brand.name} home`}>
      {inner}
    </Link>
  );
}
