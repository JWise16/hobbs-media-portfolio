// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { heroInit } from "@/lib/playbackPolicy";

/**
 * Edge paths of the inline hero script that heroIsland.test.ts does not reach:
 * the null / windowless guards, the no-poster and poster-error starts, the
 * synchronous play() throw and the legacy void return, and the started guard.
 */

function stubMatchMedia(map: Record<string, boolean>) {
  window.matchMedia = vi.fn((q: string) => ({ matches: !!map[q] }) as MediaQueryList);
}

function video(attrs: Record<string, string>, playImpl: () => unknown) {
  const v = document.createElement("video");
  for (const [k, val] of Object.entries(attrs)) v.setAttribute(k, val);
  v.play = vi.fn(playImpl) as unknown as typeof v.play;
  document.body.appendChild(v);
  return v as HTMLVideoElement & { play: ReturnType<typeof vi.fn> };
}

const tick = () => new Promise((r) => setTimeout(r, 5));

beforeEach(() => {
  document.body.innerHTML = "";
  stubMatchMedia({});
});

describe("heroInit guards and start paths", () => {
  it("returns without throwing for a null video or a video whose document has no window", () => {
    expect(() => heroInit(null as unknown as HTMLVideoElement)).not.toThrow();

    const v = video({ src: "/720.mp4", poster: "/p.jpg", "data-hero-init": "0" }, () => Promise.resolve());
    Object.defineProperty(v, "ownerDocument", { value: { defaultView: null }, configurable: true });
    heroInit(v);
    // Marked so a second caller (the VideoBudget on client nav) does not retry, but nothing else happens.
    expect(v.getAttribute("data-hero-init")).toBe("1");
    expect(v.play).not.toHaveBeenCalled();
    expect(v.getAttribute("data-hero-state")).toBeNull();
  });

  it("no poster starts at once; desktop without a 1080 rung keeps 720; a sync play() throw or a void return both land on playing", () => {
    stubMatchMedia({ "(min-width: 1024px)": true });

    const throwing = video({ src: "/720.mp4", "data-hero-init": "0", "data-rung": "720" }, () => {
      throw new Error("boom");
    });
    heroInit(throwing);
    expect(throwing.play).toHaveBeenCalledTimes(1);
    expect(throwing.getAttribute("preload")).toBe("auto");
    expect(throwing.getAttribute("src")).toBe("/720.mp4");
    expect(throwing.getAttribute("data-rung")).toBe("720");
    // Documented behavior: a synchronous throw is treated like a legacy void play() (no promise → assume playing).
    expect(throwing.getAttribute("data-hero-state")).toBe("playing");

    const legacy = video({ src: "/720.mp4", "data-hero-init": "0" }, () => undefined);
    heroInit(legacy);
    expect(legacy.play).toHaveBeenCalledTimes(1);
    expect(legacy.getAttribute("data-hero-state")).toBe("playing");
  });

  it("a poster that fails to load still starts; a complete poster that also fires onload plays exactly once", async () => {
    class ErrorImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      complete = false;
      set src(_v: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    (window as unknown as { Image: unknown }).Image = ErrorImage;
    const a = video({ src: "/720.mp4", poster: "/missing.jpg", "data-hero-init": "0" }, () => Promise.resolve());
    heroInit(a);
    expect(a.play).not.toHaveBeenCalled();
    await tick();
    expect(a.play).toHaveBeenCalledTimes(1);
    expect(a.getAttribute("data-hero-state")).toBe("playing");

    class CachedImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      complete = true;
      set src(_v: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    (window as unknown as { Image: unknown }).Image = CachedImage;
    const b = video({ src: "/720.mp4", poster: "/cached.jpg", "data-hero-init": "0" }, () => Promise.resolve());
    heroInit(b);
    expect(b.play).toHaveBeenCalledTimes(1);
    await tick();
    expect(b.play).toHaveBeenCalledTimes(1);
  });
});
