import { describe, expect, it } from "vitest";
import { composite, contrastRatio, ghostedBackdrop, heroBackdrop, parseColor, relativeLuminance } from "@/lib/contrast";

describe("contrast math", () => {
  it("parses hex and rgb()", () => {
    expect(parseColor("#F3EFE6")).toEqual([243, 239, 230]);
    expect(parseColor("rgb(11, 13, 18)")).toEqual([11, 13, 18]);
    expect(parseColor("rgb(11 13 18 / 0.5)")).toEqual([11, 13, 18]);
  });
  it("white on black is 21:1, equal colors 1:1", () => {
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 1);
    expect(contrastRatio([120, 120, 120], [120, 120, 120])).toBe(1);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1);
  });
  it("composites alpha", () => {
    expect(composite([200, 200, 200], [0, 0, 0], 0.5)).toEqual([100, 100, 100]);
    expect(composite([0, 0, 0], [255, 255, 255], 0)).toEqual([0, 0, 0]);
  });
  it("token pairs pass: dark/light/twilight/hobbs text on surface ≥ 4.5", () => {
    const pairs: Array<[string, string]> = [
      ["#F3EFE6", "#0B0D12"],
      ["#2A2621", "#F5F1EA"],
      ["#EFE6D6", "#12100E"],
      ["#141414", "#F7F4EE"],
      ["#F7F4EE", "#111214"],
    ];
    for (const [t, s] of pairs) expect(contrastRatio(parseColor(t), parseColor(s))).toBeGreaterThanOrEqual(4.5);
  });
  it("muted 'Media Co.' tokens reach 3:1 on their surfaces (large display text)", () => {
    expect(contrastRatio(parseColor("#8C9BB0"), parseColor("#0B0D12"))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(parseColor("#7A736B"), parseColor("#F5F1EA"))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(parseColor("#A89880"), parseColor("#12100E"))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(parseColor("#C9A24A"), parseColor("#12100E"))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(parseColor("#7E8CA0"), parseColor("#F7F4EE"))).toBeGreaterThanOrEqual(3);
  });
  it("a white-ish poster pixel under the scrim still clears 3:1 for hero text", () => {
    const bright: [number, number, number] = [235, 225, 210];
    const backdrop = heroBackdrop(bright, parseColor("rgb(20 30 50)"), 0.25);
    expect(contrastRatio(parseColor("#F3EFE6"), backdrop)).toBeGreaterThanOrEqual(3);
  });
  it("ghosted reel under the 0.86 surface keeps body text at 4.5:1 on every theme", () => {
    const worst: [number, number, number] = [255, 255, 255];
    expect(contrastRatio(parseColor("#F3EFE6"), ghostedBackdrop(worst, parseColor("#0B0D12")))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(parseColor("#EFE6D6"), ghostedBackdrop(worst, parseColor("#12100E")))).toBeGreaterThanOrEqual(4.5);
    const darkest: [number, number, number] = [0, 0, 0];
    expect(contrastRatio(parseColor("#2A2621"), ghostedBackdrop(darkest, parseColor("#F5F1EA")))).toBeGreaterThanOrEqual(4.5);
  });
});
