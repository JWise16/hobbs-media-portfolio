import type { ClipFocal } from "@/lib/clips.types";
import { HERO_INIT_SOURCE } from "@/lib/playbackPolicy";

/**
 * Templates the hero <video> plus its inline script as raw HTML (eng 2A).
 * A server component injects it with dangerouslySetInnerHTML so React never
 * reconciles the subtree; the inline script runs during parse, before
 * hydration, and picks the 1080 rung on desktop before the first byte of
 * video is requested.
 *
 * No `autoplay` attribute anywhere (T4). The script waits for the poster,
 * checks reduced motion, bumps preload to auto, then calls play().
 */

export interface HeroIslandOptions {
  id: string;
  src720: string;
  src1080?: string;
  poster: string;
  focal: ClipFocal;
  loop: boolean;
  title: string;
}

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** `</script` inside the script body would end the element early. */
export function escapeScript(source: string): string {
  return source.replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");
}

export function focalToObjectPosition(focal: ClipFocal): string {
  const pct = (n: number) => `${Math.round(Math.min(1, Math.max(0, n)) * 10000) / 100}%`;
  return `${pct(focal.x)} ${pct(focal.y)}`;
}

export function heroVideoId(id: string): string {
  return `hero-${id.replace(/[^a-z0-9-]/gi, "")}`;
}

export function renderHeroIsland(o: HeroIslandOptions): string {
  const attrs = [
    `id="${escapeAttr(heroVideoId(o.id))}"`,
    `class="hero-video"`,
    `src="${escapeAttr(o.src720)}"`,
    `data-src-720="${escapeAttr(o.src720)}"`,
    o.src1080 ? `data-src-1080="${escapeAttr(o.src1080)}"` : "",
    `poster="${escapeAttr(o.poster)}"`,
    `preload="metadata"`,
    `muted`,
    `playsinline`,
    `webkit-playsinline`,
    o.loop ? `loop` : "",
    `disablepictureinpicture`,
    `disableremoteplayback`,
    `aria-hidden="true"`,
    `tabindex="-1"`,
    `data-hero-init="0"`,
    `data-hero-state="idle"`,
    `data-rung="720"`,
    `data-clip="${escapeAttr(o.id)}"`,
    `data-title="${escapeAttr(o.title)}"`,
    `style="object-position: ${escapeAttr(focalToObjectPosition(o.focal))}"`,
  ]
    .filter(Boolean)
    .join(" ");

  const script = `(${escapeScript(HERO_INIT_SOURCE)})(document.currentScript.previousElementSibling)`;

  return `<video ${attrs}></video><script>${script}</script>`;
}
