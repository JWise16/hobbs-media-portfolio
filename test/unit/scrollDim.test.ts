// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { ScrollDim, applyDimVars, dimProgress, easeOutCubic, snapshot } from "@/lib/scrollDim";

describe("dimProgress", () => {
  it("is 0 at the top, 1 at 0.6svh, clamped", () => {
    expect(dimProgress(0, 1000)).toBe(0);
    expect(dimProgress(300, 1000)).toBeCloseTo(0.5);
    expect(dimProgress(600, 1000)).toBe(1);
    expect(dimProgress(2000, 1000)).toBe(1);
    expect(dimProgress(-10, 1000)).toBe(0);
  });
  it("eases out cubic", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
    expect(snapshot(300, 1000).eased).toBeCloseTo(0.875);
  });
});

describe("ScrollDim store", () => {
  it("publishes on scroll via rAF and applies CSS variables", () => {
    Object.defineProperty(window, "innerHeight", { value: 1000, configurable: true });
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    let frame: FrameRequestCallback | null = null;
    window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      frame = cb;
      return 1;
    });
    window.cancelAnimationFrame = vi.fn();
    const store = new ScrollDim(window);
    const seen: number[] = [];
    store.subscribe((s) => seen.push(s.progress));
    store.start();
    frame!(0);
    expect(seen).toEqual([0]);
    (window as unknown as { scrollY: number }).scrollY = 300;
    window.dispatchEvent(new Event("scroll"));
    frame!(0);
    expect(seen).toEqual([0, 0.5]);
    (window as unknown as { scrollY: number }).scrollY = 900;
    window.dispatchEvent(new Event("scroll"));
    frame!(0);
    expect(seen).toEqual([0, 0.5, 1]);

    const el = document.createElement("div");
    applyDimVars(el, store.value);
    expect(el.style.getPropertyValue("--p")).toBe("1.0000");
    expect(el.style.getPropertyValue("--pe")).toBe("1.0000");
    expect(el.getAttribute("data-progress")).toBe("1");
    applyDimVars(el, snapshot(300, 1000));
    expect(el.getAttribute("data-progress")).toBe("mid");
    store.stop();
  });
});
