import { describe, expect, it } from "vitest";
import { decide, measure, pickRung, type PolicyContext, type PolicyItem } from "@/lib/playbackPolicy";

const ctx = (over: Partial<PolicyContext> = {}): PolicyContext => ({ reducedMotion: false, visible: true, scrollProgress: 0, ...over });

const item = (over: Partial<PolicyItem> & { id: string }): PolicyItem => ({
  kind: "stack",
  distance: 0,
  centerOffset: 0,
  state: "detached",
  userPaused: false,
  ...over,
});

describe("measure", () => {
  it("is 0 while intersecting, in viewports otherwise", () => {
    expect(measure({ top: 100, bottom: 500 }, 800).distance).toBe(0);
    expect(measure({ top: -1000, bottom: -400 }, 800).distance).toBe(0.5);
    expect(measure({ top: 2400, bottom: 2800 }, 800).distance).toBe(2);
  });
  it("center offset is distance of the element center from the viewport center", () => {
    expect(measure({ top: 300, bottom: 500 }, 800).centerOffset).toBe(0);
    expect(measure({ top: 0, bottom: 200 }, 800).centerOffset).toBe(300);
  });
});

describe("pickRung", () => {
  it("1080 on desktop when available, else 720", () => {
    expect(pickRung("/a.720.mp4", "/a.1080.mp4", true)).toEqual({ src: "/a.1080.mp4", rung: "1080" });
    expect(pickRung("/a.720.mp4", "/a.1080.mp4", false)).toEqual({ src: "/a.720.mp4", rung: "720" });
    expect(pickRung("/a.720.mp4", undefined, true)).toEqual({ src: "/a.720.mp4", rung: "720" });
  });
});

describe("decide", () => {
  it("attaches within one viewport and releases beyond two", () => {
    const out = decide(
      [item({ id: "a", distance: 0.5 }), item({ id: "b", distance: 1.5 }), item({ id: "c", distance: 2.5, state: "attached" }), item({ id: "d", distance: 1.5, state: "attached" })],
      ctx(),
    );
    expect(out.get("a")).toBe("attach");
    expect(out.get("b")).toBe("keep");
    expect(out.get("c")).toBe("detach");
    expect(out.get("d")).toBe("keep");
  });

  it("plays exactly one: the intersecting attached clip closest to center", () => {
    const out = decide(
      [
        item({ id: "a", state: "attached", centerOffset: 300 }),
        item({ id: "b", state: "attached", centerOffset: 20 }),
        item({ id: "c", state: "playing", centerOffset: 500 }),
      ],
      ctx(),
    );
    expect(out.get("b")).toBe("play");
    expect(out.get("c")).toBe("pause");
    expect(out.get("a")).toBe("keep");
    expect([...out.values()].filter((a) => a === "play")).toHaveLength(1);
  });

  it("a newly attached clip can win in the same pass (play implies attach)", () => {
    const out = decide([item({ id: "a", distance: 0, centerOffset: 10 })], ctx());
    expect(out.get("a")).toBe("play");
  });

  it("hero wins while scroll progress < 1, loses to the closest clip after", () => {
    const items = [item({ id: "hero", kind: "hero", state: "attached", centerOffset: 400 }), item({ id: "s", state: "attached", centerOffset: 0 })];
    expect(decide(items, ctx({ scrollProgress: 0.5 })).get("hero")).toBe("play");
    expect(decide(items, ctx({ scrollProgress: 0.5 })).get("s")).toBe("keep");
    const after = decide(items, ctx({ scrollProgress: 1 }));
    expect(after.get("s")).toBe("play");
    expect(after.get("hero")).toBe("keep");
  });

  it("a tapped (pinned) clip wins over the closest clip and over hero priority while it stays in view", () => {
    const items = [
      item({ id: "hero", kind: "hero", state: "attached", centerOffset: 0 }),
      item({ id: "a", state: "attached", centerOffset: 10 }),
      item({ id: "b", state: "playing", centerOffset: 300, pinned: true }),
    ];
    const out = decide(items, ctx({ scrollProgress: 0.2 }));
    expect(out.get("b")).toBe("keep");
    expect(out.get("hero")).toBe("keep");
    expect(out.get("a")).toBe("keep");
    // Out of view, the pin no longer counts (the controller clears it; the policy ignores non-intersecting items anyway).
    const gone = decide([...items.slice(0, 2), { ...items[2], distance: 0.5 }], ctx({ scrollProgress: 1 }));
    expect(gone.get("hero")).toBe("play"); // closest to center again
    expect(gone.get("b")).toBe("pause"); // the pinned clip lost the slot once it left the viewport
  });

  it("hero wins ties at progress 1", () => {
    const items = [item({ id: "hero", kind: "hero", state: "attached", centerOffset: 10 }), item({ id: "s", state: "attached", centerOffset: 10 })];
    expect(decide(items, ctx({ scrollProgress: 1 })).get("hero")).toBe("play");
  });

  it("a hero more than two viewports away is released and re-attached within one", () => {
    expect(decide([item({ id: "hero", kind: "hero", state: "attached", distance: 2.5 })], ctx({ scrollProgress: 1 })).get("hero")).toBe("detach");
    expect(decide([item({ id: "hero", kind: "hero", state: "detached", distance: 0.8 })], ctx({ scrollProgress: 1 })).get("hero")).toBe("attach");
  });

  it("hidden tab pauses everything and plays nothing", () => {
    const out = decide([item({ id: "a", state: "playing" }), item({ id: "b", state: "attached", centerOffset: 0 })], ctx({ visible: false }));
    expect(out.get("a")).toBe("pause");
    expect(out.get("b")).toBe("keep");
  });

  it("reduced motion: stack stays on posters, hero pauses", () => {
    const out = decide(
      [item({ id: "a", state: "attached" }), item({ id: "b" }), item({ id: "hero", kind: "hero", state: "playing" })],
      ctx({ reducedMotion: true }),
    );
    expect(out.get("a")).toBe("detach");
    expect(out.get("b")).toBe("keep");
    expect(out.get("hero")).toBe("pause");
  });

  it("user-paused and blocked clips never win; the next closest does", () => {
    const out = decide(
      [
        item({ id: "a", state: "paused", userPaused: true, centerOffset: 0 }),
        item({ id: "b", state: "blocked", centerOffset: 5 }),
        item({ id: "c", state: "attached", centerOffset: 50 }),
      ],
      ctx(),
    );
    expect(out.get("c")).toBe("play");
    expect(out.get("a")).toBe("keep");
    expect(out.get("b")).toBe("keep");
  });

  it("a non-intersecting attached clip (within one viewport) does not play", () => {
    const out = decide([item({ id: "a", state: "attached", distance: 0.4, centerOffset: 900 })], ctx());
    expect(out.get("a")).toBe("keep");
  });

  it("keeps a playing winner playing", () => {
    const out = decide([item({ id: "a", state: "playing", centerOffset: 0 })], ctx());
    expect(out.get("a")).toBe("keep");
  });
});
