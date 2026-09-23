// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VideoBudget, videoBudget } from "@/lib/VideoBudget";

/**
 * Controller paths VideoBudget.test.ts leaves open: destroy/restart, duplicate
 * and unknown elements, an island that was already blocked, synchronous and
 * legacy play() returns, attach details, late promise settlement after a pause
 * or unregister, and the page singleton with the default rect.
 */

interface Fake {
  el: HTMLVideoElement;
  rect: { top: number; bottom: number };
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
}

let mediaFlags: Record<string, boolean> = {};

function fakeVideo(top: number, height = 400): Fake {
  const el = document.createElement("video");
  const rect = { top, bottom: top + height };
  const play = vi.fn(() => Promise.resolve());
  const pause = vi.fn();
  const load = vi.fn();
  el.play = play as unknown as typeof el.play;
  el.pause = pause as unknown as typeof el.pause;
  el.load = load as unknown as typeof el.load;
  document.body.appendChild(el);
  return { el, rect, play, pause, load };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  document.body.innerHTML = "";
  mediaFlags = {};
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

describe("VideoBudget edges", () => {
  it("destroy() pauses what plays, forgets every entry and drops its listeners; start() twice is a no-op; it can be restarted", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const b = new VideoBudget({ win: window });
    b.start();
    b.start();
    expect(add.mock.calls.filter((c) => c[0] === "scroll")).toHaveLength(1);

    const a = fakeVideo(100);
    reg(b, a);
    b.update();
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("playing");

    const remove = vi.spyOn(window, "removeEventListener");
    b.destroy();
    expect(a.pause).toHaveBeenCalled();
    expect(b.states()).toHaveLength(0);
    expect(remove.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(["scroll", "resize"]));

    b.start();
    reg(b, a);
    expect(b.states()).toHaveLength(1);
    add.mockRestore();
    remove.mockRestore();

    // Registering the same element twice keeps one entry; strangers are no-ops.
    const off1 = reg(b, a);
    expect(b.states()).toHaveLength(1);
    const stranger = document.createElement("video");
    expect(b.toggle(stranger)).toBe(false);
    expect(() => b.unregister(stranger)).not.toThrow();
    off1();
    expect(b.states()).toHaveLength(0);
    expect(() => off1()).not.toThrow();
  });

  it("a hero the island already marked blocked registers as blocked, never wins on its own, and a tap retries play", async () => {
    const b = budget();
    const hero = fakeVideo(0, 800);
    hero.el.setAttribute("src", "/h.720.mp4");
    hero.el.setAttribute("data-hero-init", "1");
    hero.el.setAttribute("data-hero-state", "blocked");
    reg(b, hero, "hero", { src720: "/h.720.mp4" });
    expect(hero.el.getAttribute("data-state")).toBe("blocked");
    expect(b.states()[0].state).toBe("blocked");

    b.update();
    await flush();
    expect(hero.play).not.toHaveBeenCalled();

    expect(b.toggle(hero.el)).toBe(false);
    await flush();
    expect(hero.play).toHaveBeenCalledTimes(1);
    expect(hero.el.getAttribute("data-state")).toBe("playing");
  });

  it("play() that throws synchronously flips to blocked; a legacy void play() stays playing", async () => {
    const b1 = budget();
    const a = fakeVideo(100);
    a.play.mockImplementation(() => {
      throw new Error("boom");
    });
    reg(b1, a);
    b1.update();
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("blocked");

    const b2 = budget();
    const c = fakeVideo(100);
    c.play.mockImplementation(() => undefined);
    reg(b2, c);
    b2.update();
    await flush();
    expect(c.el.getAttribute("data-state")).toBe("playing");
    expect(c.play).toHaveBeenCalledTimes(1);
  });

  it("attach sets loop only for looping clips and does not reload an already-attached src; resuming a released clip lands on detached", () => {
    const b = budget();
    const a = fakeVideo(100);
    reg(b, a);
    b.update();
    expect(a.el.getAttribute("src")).toBe("/x.720.mp4");
    expect(a.el.hasAttribute("loop")).toBe(true);
    expect(a.load).toHaveBeenCalledTimes(1);

    expect(b.toggle(a.el)).toBe(true); // user pause
    expect(b.toggle(a.el)).toBe(false); // resume: src still present → attached, no reload
    expect(a.el.getAttribute("data-state")).toBe("attached");
    expect(a.load).toHaveBeenCalledTimes(1);

    const once = fakeVideo(1000);
    reg(b, once, "stack", { loop: false });
    b.update();
    expect(once.el.getAttribute("src")).toBe("/x.720.mp4");
    expect(once.el.hasAttribute("loop")).toBe(false);

    const far = fakeVideo(3000);
    reg(b, far);
    b.update();
    expect(far.el.getAttribute("src")).toBeNull();
    expect(b.toggle(far.el)).toBe(true);
    expect(far.el.getAttribute("data-state")).toBe("paused");
    expect(b.toggle(far.el)).toBe(false);
    expect(far.el.getAttribute("data-state")).toBe("detached");
  });

  it("late play() settlement respects a pause or unregister that happened meanwhile", async () => {
    // Resolve after the user paused: state ends paused, not playing.
    const b1 = budget();
    let resolveA!: () => void;
    const a = fakeVideo(100);
    a.play.mockImplementation(() => new Promise<void>((res) => (resolveA = res)));
    reg(b1, a);
    b1.update();
    expect(a.el.getAttribute("data-state")).toBe("playing");
    b1.toggle(a.el);
    expect(a.el.getAttribute("data-state")).toBe("paused");
    resolveA();
    await flush();
    expect(a.el.getAttribute("data-state")).toBe("paused");

    // Reject after a hidden-tab pause: the rejection must not turn an attached clip blocked.
    const b2 = budget();
    let rejectC!: (e: Error) => void;
    const c = fakeVideo(100);
    c.play.mockImplementation(() => new Promise<void>((_, rej) => (rejectC = rej)));
    reg(b2, c);
    b2.update();
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    b2.update();
    expect(c.el.getAttribute("data-state")).toBe("attached");
    rejectC(new Error("NotAllowedError"));
    await flush();
    expect(c.el.getAttribute("data-state")).toBe("attached");
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });

    // Reject after unregister: nothing throws and nothing is written to a forgotten element.
    const b3 = budget();
    let rejectD!: (e: Error) => void;
    const d = fakeVideo(100);
    d.play.mockImplementation(() => new Promise<void>((_, rej) => (rejectD = rej)));
    const off = reg(b3, d);
    b3.update();
    off();
    rejectD(new Error("NotAllowedError"));
    await flush();
    expect(b3.states()).toHaveLength(0);
    expect(d.el.getAttribute("data-state")).not.toBe("blocked");
  });

  it("videoBudget() is one started singleton that measures with getBoundingClientRect when no rect is given", async () => {
    const s1 = videoBudget();
    expect(videoBudget()).toBe(s1);
    const el = document.createElement("video");
    el.play = vi.fn(() => Promise.resolve()) as unknown as typeof el.play;
    el.pause = vi.fn() as unknown as typeof el.pause;
    el.load = vi.fn() as unknown as typeof el.load;
    el.getBoundingClientRect = vi.fn(() => ({ top: 100, bottom: 500 }) as DOMRect);
    document.body.appendChild(el);
    const off = s1.register({ el, kind: "stack", src720: "/g.720.mp4", loop: true });
    s1.update();
    await flush();
    expect(el.getBoundingClientRect).toHaveBeenCalled();
    expect(el.getAttribute("src")).toBe("/g.720.mp4");
    expect(el.getAttribute("data-state")).toBe("playing");
    off();
  });
});
