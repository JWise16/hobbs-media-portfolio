// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { escapeAttr, escapeScript, focalToObjectPosition, heroVideoId, renderHeroIsland } from "@/lib/heroIsland";
import { DESKTOP_QUERY, HERO_INIT_SOURCE, REDUCED_MOTION_QUERY, heroInit } from "@/lib/playbackPolicy";

const base = {
  id: "sunset",
  src720: "/clips/sunset.deadbeef.720.mp4",
  src1080: "/clips/sunset.deadbeef.1080.mp4",
  poster: "/clips/sunset.deadbeef.jpg",
  focal: { x: 0.5, y: 0.45 },
  loop: true,
  title: "Sunset over the Sound",
};

describe("renderHeroIsland", () => {
  it("renders the 720 rung as the server src, the 1080 rung as data, poster, metadata preload, no autoplay", () => {
    const html = renderHeroIsland(base);
    expect(html).toContain(`src="/clips/sunset.deadbeef.720.mp4"`);
    expect(html).toContain(`data-src-1080="/clips/sunset.deadbeef.1080.mp4"`);
    expect(html).toContain(`poster="/clips/sunset.deadbeef.jpg"`);
    expect(html).toContain(`preload="metadata"`);
    expect(html).toContain(" muted ");
    expect(html).toContain(" playsinline ");
    expect(html).toContain(" loop ");
    expect(html).toContain(`aria-hidden="true"`);
    expect(html).toContain(`data-hero-init="0"`);
    expect(html).toContain(`id="hero-sunset"`);
    expect(html).not.toMatch(/\bautoplay\b/);
  });

  it("omits loop for play-once clips and the 1080 rung for vertical sources", () => {
    const html = renderHeroIsland({ ...base, loop: false, src1080: undefined });
    const videoTag = html.slice(0, html.indexOf("<script>"));
    expect(videoTag).not.toContain(" loop ");
    expect(videoTag).not.toContain("data-src-1080");
  });

  it("embeds the shared heroInit source verbatim and calls it on the previous sibling", () => {
    const html = renderHeroIsland(base);
    expect(html).toContain(HERO_INIT_SOURCE);
    // The inline script must keep the same media queries the controller uses.
    expect(HERO_INIT_SOURCE).toContain(DESKTOP_QUERY);
    expect(HERO_INIT_SOURCE).toContain(REDUCED_MOTION_QUERY);
    expect(html).toContain(`data-src-720="/clips/sunset.deadbeef.720.mp4"`);
    expect(html).toContain("(document.currentScript.previousElementSibling)");
    expect(html.indexOf("<video")).toBeLessThan(html.indexOf("<script>"));
  });

  it("escapes ids, URLs and titles", () => {
    const html = renderHeroIsland({
      ...base,
      id: 'x"y<z',
      src720: `/clips/a"b.mp4?x=<1>&y='2'`,
      poster: "/clips/p.jpg\"><script>alert(1)</script>",
      title: `Sam's "reel" <3`,
    });
    expect(html).not.toContain(`<script>alert`);
    expect(html).toContain(`data-clip="x&quot;y&lt;z"`);
    expect(html).toContain(`src="/clips/a&quot;b.mp4?x=&lt;1&gt;&amp;y=&#39;2&#39;"`);
    expect(html).toContain(`data-title="Sam&#39;s &quot;reel&quot; &lt;3"`);
    expect(html).toContain(`id="hero-xyz"`);
  });

  it("maps focal to object-position", () => {
    expect(focalToObjectPosition({ x: 0.5, y: 0.45 })).toBe("50% 45%");
    expect(focalToObjectPosition({ x: 1.4, y: -1 })).toBe("100% 0%");
    expect(renderHeroIsland(base)).toContain(`style="object-position: 50% 45%"`);
  });

  it("helpers", () => {
    expect(escapeAttr(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
    expect(escapeScript("a</script>b<!--c")).toBe("a<\\/script>b<\\!--c");
    expect(heroVideoId("a b/c-1")).toBe("hero-abc-1");
  });
});

describe("heroInit (the inline script, executed standalone)", () => {
  function makeVideo(attrs: Record<string, string>, playImpl: () => Promise<void>) {
    const v = document.createElement("video");
    for (const [k, val] of Object.entries(attrs)) v.setAttribute(k, val);
    v.play = vi.fn(playImpl);
    document.body.appendChild(v);
    return v;
  }

  function stubMatchMedia(map: Record<string, boolean>) {
    window.matchMedia = vi.fn((q: string) => ({ matches: !!map[q] }) as MediaQueryList);
  }

  function stubImage(complete: boolean) {
    class FakeImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      complete = complete;
      set src(_v: string) {
        if (!complete) setTimeout(() => this.onload?.(), 0);
      }
    }
    (window as unknown as { Image: unknown }).Image = FakeImage;
  }

  const tick = () => new Promise((r) => setTimeout(r, 5));

  it("runs as a standalone string: picks 1080 on desktop, waits for the poster, sets preload=auto, plays", async () => {
    stubMatchMedia({ "(min-width: 1024px)": true });
    stubImage(false);
    const v = makeVideo(
      { src: "/720.mp4", "data-src-1080": "/1080.mp4", poster: "/p.jpg", preload: "metadata", "data-hero-init": "0" },
      () => Promise.resolve(),
    );
    // Evaluate the serialized source, not the function object, so helper references would fail here.
    const fn = new Function(`return (${HERO_INIT_SOURCE})`)() as typeof heroInit;
    fn(v);
    expect(v.getAttribute("data-hero-init")).toBe("1");
    expect(v.getAttribute("src")).toBe("/1080.mp4");
    expect(v.getAttribute("data-rung")).toBe("1080");
    expect(v.play).not.toHaveBeenCalled(); // waits for the poster
    await tick();
    expect(v.getAttribute("preload")).toBe("auto");
    expect(v.play).toHaveBeenCalledTimes(1);
    await tick();
    expect(v.getAttribute("data-hero-state")).toBe("playing");
  });

  it("keeps 720 on phones", async () => {
    stubMatchMedia({});
    stubImage(true);
    const v = makeVideo({ src: "/720.mp4", "data-src-1080": "/1080.mp4", poster: "/p.jpg", "data-hero-init": "0" }, () => Promise.resolve());
    heroInit(v);
    expect(v.getAttribute("src")).toBe("/720.mp4");
    await tick();
    expect(v.play).toHaveBeenCalledTimes(1);
  });

  it("reduced motion: never plays, state reduced", async () => {
    stubMatchMedia({ "(prefers-reduced-motion: reduce)": true });
    stubImage(true);
    const v = makeVideo({ src: "/720.mp4", poster: "/p.jpg", "data-hero-init": "0" }, () => Promise.resolve());
    heroInit(v);
    await tick();
    expect(v.play).not.toHaveBeenCalled();
    expect(v.getAttribute("data-hero-state")).toBe("reduced");
    expect(v.getAttribute("preload")).toBeNull();
  });

  it("play() rejection (Low Power Mode) → blocked, poster stays, nothing throws", async () => {
    stubMatchMedia({});
    stubImage(true);
    const v = makeVideo({ src: "/720.mp4", poster: "/p.jpg", "data-hero-init": "0" }, () => Promise.reject(new Error("NotAllowedError")));
    heroInit(v);
    await tick();
    expect(v.getAttribute("data-hero-state")).toBe("blocked");
    expect(v.getAttribute("poster")).toBe("/p.jpg");
  });

  it("is idempotent: a second call (client nav path) does nothing", async () => {
    stubMatchMedia({});
    stubImage(true);
    const v = makeVideo({ src: "/720.mp4", poster: "/p.jpg", "data-hero-init": "0" }, () => Promise.resolve());
    heroInit(v);
    heroInit(v);
    await tick();
    expect(v.play).toHaveBeenCalledTimes(1);
  });

  it("a video error after the poster marks the state and leaves the poster", async () => {
    stubMatchMedia({});
    stubImage(true);
    const v = makeVideo({ src: "/720.mp4", "data-src-720": "/720.mp4", poster: "/p.jpg", "data-hero-init": "0" }, () => Promise.resolve());
    heroInit(v);
    v.dispatchEvent(new Event("error"));
    expect(v.getAttribute("data-hero-state")).toBe("error");
    expect(v.getAttribute("poster")).toBe("/p.jpg");
  });

  it("a broken 1080 rung falls back to the 720 rung once, then errors", async () => {
    stubMatchMedia({ "(min-width: 1024px)": true });
    stubImage(true);
    const v = makeVideo(
      { src: "/720.mp4", "data-src-720": "/720.mp4", "data-src-1080": "/1080.mp4", poster: "/p.jpg", "data-hero-init": "0" },
      () => Promise.resolve(),
    );
    v.load = vi.fn();
    heroInit(v);
    await tick();
    expect(v.getAttribute("src")).toBe("/1080.mp4");
    v.dispatchEvent(new Event("error"));
    expect(v.getAttribute("src")).toBe("/720.mp4");
    expect(v.getAttribute("data-rung")).toBe("720");
    expect(v.load).toHaveBeenCalled();
    expect(v.play).toHaveBeenCalledTimes(2);
    expect(v.getAttribute("data-hero-state")).not.toBe("error");
    v.dispatchEvent(new Event("error"));
    expect(v.getAttribute("data-hero-state")).toBe("error");
  });

  it("a NotSupportedError rejection arriving after the final error never downgrades error to blocked", async () => {
    stubMatchMedia({});
    stubImage(true);
    let rejectIt: ((e: Error) => void) | null = null;
    const v = makeVideo(
      { src: "/720.mp4", "data-src-720": "/720.mp4", poster: "/p.jpg", "data-hero-init": "0" },
      () => new Promise<void>((_, rej) => (rejectIt = rej)),
    );
    heroInit(v);
    await tick();
    Object.defineProperty(v, "error", { value: { code: 4 }, configurable: true });
    v.dispatchEvent(new Event("error"));
    const notSupported = new Error("The element has no supported sources.");
    notSupported.name = "NotSupportedError";
    rejectIt!(notSupported);
    await tick();
    expect(v.getAttribute("data-hero-state")).toBe("error");
  });

  it("with the controller owning the element, a media error still wins over the pending rejection", async () => {
    stubMatchMedia({});
    stubImage(true);
    let rejectIt: ((e: Error) => void) | null = null;
    const v = makeVideo({ src: "/720.mp4", "data-src-720": "/720.mp4", poster: "/p.jpg", "data-hero-init": "0" }, () => new Promise<void>((_, rej) => (rejectIt = rej)));
    heroInit(v);
    await tick();
    v.setAttribute("data-state", "attached"); // controller registered; island error handler steps aside
    Object.defineProperty(v, "error", { value: { code: 4 }, configurable: true });
    v.dispatchEvent(new Event("error"));
    const notSupported = new Error("no supported sources");
    notSupported.name = "NotSupportedError";
    rejectIt!(notSupported);
    await tick();
    expect(v.getAttribute("data-hero-state")).toBe("error");
  });

  it("a poster that lands after the controller took over does not start playback on its own", async () => {
    stubMatchMedia({});
    stubImage(false); // poster loads asynchronously
    const v = makeVideo({ src: "/720.mp4", poster: "/p.jpg", "data-hero-init": "0" }, () => Promise.resolve());
    heroInit(v);
    v.setAttribute("data-state", "paused"); // hydration + a user pause before the poster arrives
    await tick();
    expect(v.play).not.toHaveBeenCalled();
  });

  it("a stale AbortError from the load() after the fallback never marks the hero blocked", async () => {
    stubMatchMedia({ "(min-width: 1024px)": true });
    stubImage(true);
    let rejectFirst: ((e: Error) => void) | null = null;
    let calls = 0;
    const v = makeVideo(
      { src: "/720.mp4", "data-src-720": "/720.mp4", "data-src-1080": "/1080.mp4", poster: "/p.jpg", "data-hero-init": "0" },
      () => (++calls === 1 ? new Promise<void>((_, rej) => (rejectFirst = rej)) : Promise.resolve()),
    );
    v.load = vi.fn();
    heroInit(v);
    await tick();
    v.dispatchEvent(new Event("error")); // 1080 fails while the first play() is pending
    const abort = new Error("interrupted by load()");
    abort.name = "AbortError";
    rejectFirst!(abort);
    await tick();
    expect(v.getAttribute("data-hero-state")).toBe("playing");
  });

  it("once the controller owns the element (data-state present) the island handler steps aside", async () => {
    stubMatchMedia({ "(min-width: 1024px)": true });
    stubImage(true);
    const v = makeVideo(
      { src: "/720.mp4", "data-src-720": "/720.mp4", "data-src-1080": "/1080.mp4", poster: "/p.jpg", "data-hero-init": "0" },
      () => Promise.resolve(),
    );
    heroInit(v);
    await tick();
    v.setAttribute("data-state", "playing");
    v.dispatchEvent(new Event("error"));
    expect(v.getAttribute("src")).toBe("/1080.mp4"); // untouched: the controller handles it
    expect(v.getAttribute("data-hero-state")).toBe("playing");
  });
});
