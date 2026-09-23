// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VideoBudget } from "@/lib/VideoBudget";

interface Fake {
  el: HTMLVideoElement;
  rect: { top: number; bottom: number };
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
}

let mediaFlags: Record<string, boolean> = {};

function fakeVideo(top: number, height = 400, playResult: "ok" | "reject" = "ok"): Fake {
  const el = document.createElement("video");
  const rect = { top, bottom: top + height };
  const play = vi.fn(() => {
    if (playResult === "ok") return Promise.resolve();
    const err = new Error("play() failed because the user didn't interact");
    err.name = "NotAllowedError";
    return Promise.reject(err);
  });
  const pause = vi.fn();
  el.play = play as unknown as typeof el.play;
  el.pause = pause as unknown as typeof el.pause;
  el.load = vi.fn() as unknown as typeof el.load;
  document.body.appendChild(el);
  return { el, rect, play, pause };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

const OriginalImage = window.Image;

beforeEach(() => {
  document.body.innerHTML = "";
  mediaFlags = {};
  (window as unknown as { Image: unknown }).Image = OriginalImage;
  window.matchMedia = vi.fn((q: string) => ({ matches: !!mediaFlags[q], addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
  Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
});

function budget() {
  const b = new VideoBudget({ win: window });
  b.start();
  return b;
}

function reg(b: VideoBudget, f: Fake, kind: "hero" | "stack" = "stack", extra: Partial<Parameters<VideoBudget["register"]>[0]> = {}) {
  return b.register({ el: f.el, kind, src720: "/x.720.mp4", src1080: "/x.1080.mp4", loop: true, rect: () => f.rect, ...extra });
}

describe("VideoBudget", () => {
  it("attaches src within one viewport, plays only the closest, pauses the rest", async () => {
    const b = budget();
    const a = fakeVideo(100); // center 300, offset 100
    const c = fakeVideo(300); // center 500, offset 100 → tie; first registered wins by reduce order
    const far = fakeVideo(1400); // 0.75 viewports away: attach, no play
    const gone = fakeVideo(3000); // 2.75 viewports: stays detached
    reg(b, a);
    reg(b, c);
    reg(b, far);
    reg(b, gone);
    b.update(); // attach pass
    expect(a.el.getAttribute("src")).toBe("/x.720.mp4");
    // attach fetches metadata only; play() bumps to auto
    expect(far.el.getAttribute("preload")).toBe("metadata");
    expect(far.el.getAttribute("src")).toBe("/x.720.mp4");
    expect(gone.el.getAttribute("src")).toBeNull();
    b.update(); // play pass
    await flush();
    const playing = b.states().filter((s) => s.state === "playing");
    expect(playing).toHaveLength(1);
    expect(a.play).toHaveBeenCalledTimes(1);
    expect(c.play).not.toHaveBeenCalled();
    expect(far.play).not.toHaveBeenCalled();

    // Scroll so c is closer: a pauses, c plays.
    a.rect = { top: -300, bottom: 100 };
    c.rect = { top: 200, bottom: 600 };
    b.update();
    await flush();
    expect(a.pause).toHaveBeenCalled();
    expect(c.play).toHaveBeenCalledTimes(1);
    expect(b.states().filter((s) => s.state === "playing")).toHaveLength(1);
  });

  it("releases src beyond two viewports and re-attaches within one", () => {
    const b = budget();
    const a = fakeVideo(100);
    reg(b, a);
    b.update();
    expect(a.el.getAttribute("src")).toBe("/x.720.mp4");
    a.rect = { top: 3000, bottom: 3400 };
    b.update();
    expect(a.el.getAttribute("src")).toBeNull();
    expect(a.el.getAttribute("preload")).toBe("none");
    expect(a.el.load).toHaveBeenCalled();
    a.rect = { top: 900, bottom: 1300 };
    b.update();
    expect(a.el.getAttribute("src")).toBe("/x.720.mp4");
  });

  it("picks the 1080 rung on desktop", () => {
    mediaFlags["(min-width: 1024px)"] = true;
    const b = budget();
    const a = fakeVideo(100);
    reg(b, a);
    b.update();
    expect(a.el.getAttribute("src")).toBe("/x.1080.mp4");
    expect(a.el.getAttribute("data-rung")).toBe("1080");
  });

  it("a stale AbortError from an interrupting pause never marks the clip blocked (fast scroll)", async () => {
    const b = budget();
    const a = fakeVideo(100);
    let rejectFirst: ((e: Error) => void) | null = null;
    a.play.mockImplementationOnce(() => new Promise<void>((_, rej) => (rejectFirst = rej)));
    reg(b, a);
    b.update();
    b.update();
    expect(a.el.getAttribute("data-state")).toBe("playing");
    // Scroll away: pause interrupts the pending play(); the browser rejects the old promise with AbortError.
    a.rect = { top: 3000, bottom: 3400 };
    b.update();
    const abort = new Error("The play() request was interrupted");
    abort.name = "AbortError";
    rejectFirst!(abort);
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("detached");
    // Back in view: plays again, never blocked.
    a.rect = { top: 100, bottom: 500 };
    b.update();
    b.update();
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("playing");
  });

  it("a broken 1080 rung falls back to 720 once; a second error keeps the poster and excludes the clip", async () => {
    mediaFlags["(min-width: 1024px)"] = true;
    const b = budget();
    const a = fakeVideo(100);
    reg(b, a);
    b.update();
    expect(a.el.getAttribute("src")).toBe("/x.1080.mp4");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    a.el.dispatchEvent(new Event("error"));
    expect(a.el.getAttribute("src")).toBe("/x.720.mp4");
    expect(a.el.getAttribute("data-rung")).toBe("720");
    b.update();
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("playing");
    a.el.dispatchEvent(new Event("error"));
    expect(a.el.getAttribute("data-state")).toBe("attached");
    a.play.mockClear();
    b.update();
    b.update();
    expect(a.play).not.toHaveBeenCalled(); // errored: never a candidate until a tap
    b.toggle(a.el);
    expect(a.play).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("play() rejection → BLOCKED with the affordance state; a tap retries", async () => {
    const b = budget();
    const a = fakeVideo(100, 400, "reject");
    reg(b, a);
    b.update();
    b.update();
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("blocked");
    a.play.mockImplementation(() => Promise.resolve());
    b.toggle(a.el);
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("playing");
  });

  it("tap-to-pause: pauses, shows paused state, lets another clip play, resumes on second tap", async () => {
    const b = budget();
    const a = fakeVideo(100);
    const c = fakeVideo(300);
    reg(b, a);
    reg(b, c);
    b.update();
    b.update();
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("playing");
    expect(b.toggle(a.el)).toBe(true);
    expect(a.pause).toHaveBeenCalled();
    expect(a.el.getAttribute("data-state")).toBe("paused");
    b.update();
    await flush();
    expect(c.el.getAttribute("data-state")).toBe("playing");
    expect(b.toggle(a.el)).toBe(false);
    b.update();
    await flush();
    // a is closest again and resumes; c pauses
    expect(a.el.getAttribute("data-state")).toBe("playing");
    expect(c.pause).toHaveBeenCalled();
  });

  it("hidden tab pauses everything; visible resumes the closest", async () => {
    const b = budget();
    const a = fakeVideo(100);
    reg(b, a);
    b.update();
    b.update();
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("playing");
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    b.update();
    expect(a.pause).toHaveBeenCalled();
    expect(a.el.getAttribute("data-state")).toBe("attached");
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    b.update();
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("playing");
  });

  it("reduced motion: nothing attaches, nothing plays", () => {
    mediaFlags["(prefers-reduced-motion: reduce)"] = true;
    const b = budget();
    const a = fakeVideo(100);
    reg(b, a);
    b.update();
    b.update();
    expect(a.el.getAttribute("src")).toBeNull();
    expect(a.play).not.toHaveBeenCalled();
  });

  it("hero: priority while progress < 1, then the stack takes over and the covered hero pauses", async () => {
    const b = budget();
    const hero = fakeVideo(0, 800);
    hero.el.setAttribute("src", "/h.720.mp4");
    hero.el.setAttribute("data-hero-init", "1");
    hero.el.setAttribute("data-hero-state", "playing");
    const s = fakeVideo(500);
    reg(b, hero, "hero", { src720: "/h.720.mp4" });
    reg(b, s);
    expect(hero.el.getAttribute("data-state")).toBe("playing"); // synced from the island
    b.update();
    b.update();
    await flush();
    expect(s.play).not.toHaveBeenCalled(); // hero wins while progress 0
    // Scroll past the hero: progress 1, hero flow rect leaves the viewport center.
    b.setScrollProgress(1);
    hero.rect = { top: -800, bottom: 0 };
    s.rect = { top: 200, bottom: 600 };
    b.update();
    await flush();
    expect(hero.pause).toHaveBeenCalled();
    expect(s.el.getAttribute("data-state")).toBe("playing");
    // Two viewports away: the hero releases its src.
    hero.rect = { top: -2500, bottom: -1700 };
    b.update();
    expect(hero.el.getAttribute("src")).toBeNull();
    // Back within one viewport: re-attaches.
    hero.rect = { top: -1200, bottom: -400 };
    b.update();
    expect(hero.el.getAttribute("src")).toBe("/h.720.mp4");
  });

  it("hero registered with data-hero-init=0 (client navigation) runs heroInit", async () => {
    window.matchMedia = vi.fn((q: string) => ({ matches: q === "(min-width: 1024px)", addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
    (window as unknown as { Image: unknown }).Image = class {
      complete = true;
      set src(_v: string) {}
    };
    const b = budget();
    const hero = fakeVideo(0, 800);
    hero.el.setAttribute("src", "/h.720.mp4");
    hero.el.setAttribute("data-src-1080", "/h.1080.mp4");
    hero.el.setAttribute("poster", "/p.jpg");
    hero.el.setAttribute("data-hero-init", "0");
    reg(b, hero, "hero", { src720: "/h.720.mp4", src1080: "/h.1080.mp4" });
    await flush();
    expect(hero.el.getAttribute("data-hero-init")).toBe("1");
    expect(hero.el.getAttribute("src")).toBe("/h.1080.mp4");
    expect(hero.play).toHaveBeenCalled();
  });

  it("a video error after attach stays on the poster: state attached, no throw", () => {
    const b = budget();
    const a = fakeVideo(100);
    reg(b, a);
    b.update();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    a.el.dispatchEvent(new Event("error"));
    expect(a.el.getAttribute("data-state")).toBe("attached");
    warn.mockRestore();
  });

  it("unregister on unmount pauses and forgets the element", async () => {
    const b = budget();
    const a = fakeVideo(100);
    const off = reg(b, a);
    b.update();
    b.update();
    await flush();
    off();
    expect(a.pause).toHaveBeenCalled();
    expect(b.states()).toHaveLength(0);
  });
});
