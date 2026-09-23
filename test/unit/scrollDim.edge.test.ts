// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { ScrollDim, applyDimVars, scrollDim, snapshot } from "@/lib/scrollDim";

describe("ScrollDim lifecycle", () => {
  it("double start/stop are no-ops, frames coalesce, unsubscribe stops delivery, stop cancels a pending frame, vh falls back to clientHeight", () => {
    Object.defineProperty(window, "innerHeight", { value: 0, configurable: true });
    Object.defineProperty(document.documentElement, "clientHeight", { value: 1000, configurable: true });
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    const frames: FrameRequestCallback[] = [];
    window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    window.cancelAnimationFrame = vi.fn();
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const store = new ScrollDim(window);
    store.stop(); // never started: nothing to remove
    expect(remove).not.toHaveBeenCalled();

    store.start();
    store.start();
    expect(add.mock.calls.filter((c) => c[0] === "scroll")).toHaveLength(1);
    expect(frames).toHaveLength(1);
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    expect(frames).toHaveLength(1); // one pending frame absorbs every event

    const seen: number[] = [];
    const off = store.subscribe((s) => seen.push(s.progress));
    expect(seen).toEqual([0]);
    (window as unknown as { scrollY: number }).scrollY = 300;
    frames[0](0);
    expect(seen).toEqual([0, 0.5]); // 300 / (1000 * 0.6) via the clientHeight fallback

    off();
    (window as unknown as { scrollY: number }).scrollY = 600;
    window.dispatchEvent(new Event("scroll"));
    expect(frames).toHaveLength(2);
    frames[1](0);
    expect(seen).toEqual([0, 0.5]);
    expect(store.value.progress).toBe(1);

    window.dispatchEvent(new Event("scroll")); // leaves a frame pending
    store.stop();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(3);
    expect(remove.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(["scroll", "resize"]));
    store.stop();

    const el = document.createElement("div");
    applyDimVars(el, snapshot(0, 1000));
    expect(el.getAttribute("data-progress")).toBe("0");
    expect(el.style.getPropertyValue("--p")).toBe("0.0000");

    expect(scrollDim()).toBe(scrollDim());
    add.mockRestore();
    remove.mockRestore();
  });
});
