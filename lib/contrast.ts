/**
 * WCAG contrast math for the scrim tests (design 1A, 16A): text over footage
 * must reach 3:1 (plaque, wordmark) and body text over the ghosted reel 4.5:1,
 * against the darkest and lightest hero posters.
 */

export type RGB = [number, number, number];

export function parseColor(input: string): RGB {
  const s = input.trim();
  const hex = s.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  throw new Error(`unparsable color: ${input}`);
}

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Paints `over` at `alpha` on top of `under`. */
export function composite(under: RGB, over: RGB, alpha: number): RGB {
  return [0, 1, 2].map((i) => Math.round(under[i] * (1 - alpha) + over[i] * alpha)) as RGB;
}

/**
 * The hero text sits on: overlay tint, then the radial scrim (0.35 black at
 * its center), then the bottom gradient (0 at the middle of the frame).
 * At scroll 0 the dim is 0, so this is the worst case for legibility.
 */
export function heroBackdrop(posterPixel: RGB, tint: RGB, tintAlpha: number, radialAlpha = 0.35): RGB {
  const tinted = composite(posterPixel, tint, tintAlpha);
  return composite(tinted, [0, 0, 0], radialAlpha);
}

/** Share-link beat two: the reel ghosts through the 0.86 surface overlay. */
export function ghostedBackdrop(posterPixel: RGB, surface: RGB, dimMax = 0.86): RGB {
  return composite(posterPixel, surface, dimMax);
}
