/**
 * Playback policy shared by the hero island's inline script and the
 * VideoBudget controller (eng 5A, T3, T4, T5; design 6B).
 *
 * `heroInit` is serialized with `Function.prototype.toString` into the inline
 * <script> that follows the hero <video>, so it must be self-contained: no
 * imports, no references to module scope, no syntax older iOS cannot parse.
 * The controller calls the same function on client navigation when the
 * island's `data-hero-init` is still "0" (innerHTML-inserted scripts never run).
 */

export const DESKTOP_QUERY = "(min-width: 1024px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/* eslint-disable no-var */
export function heroInit(v: HTMLVideoElement): void {
  if (!v || v.getAttribute("data-hero-init") === "1") return;
  v.setAttribute("data-hero-init", "1");
  var doc = v.ownerDocument;
  var win = doc && doc.defaultView;
  if (!win) return;
  var mm = win.matchMedia;
  var hi = v.getAttribute("data-src-1080");
  if (hi && mm && mm.call(win, "(min-width: 1024px)").matches) {
    v.setAttribute("src", hi);
    v.setAttribute("data-rung", "1080");
  }
  var started = false;
  var attempt = 0;
  // Every play() goes through here. A settlement from a superseded attempt
  // (a load() after the 1080 fallback rejects the old promise with AbortError)
  // must not touch the state.
  var tryPlay = function () {
    var id = ++attempt;
    v.setAttribute("data-hero-state", "starting");
    var p = null;
    try {
      p = v.play();
    } catch (_e) {
      p = null;
    }
    if (p && typeof p.then === "function") {
      p.then(
        function () {
          if (id === attempt) v.setAttribute("data-hero-state", "playing");
        },
        function (err) {
          if (id !== attempt) return;
          if (err && err.name === "AbortError") return;
          // A media error owns the outcome (Chromium fires error before the NotSupportedError rejection).
          if (v.error) {
            v.setAttribute("data-hero-state", "error");
            return;
          }
          v.setAttribute("data-hero-state", "blocked");
        },
      );
    } else {
      v.setAttribute("data-hero-state", "playing");
    }
  };
  v.addEventListener("error", function () {
    // Once the page controller has registered the element (it sets data-state) it owns errors.
    if (v.hasAttribute("data-state")) return;
    // A broken 1080 file falls back to the 720 rung once; a second failure stays on the poster.
    var lo = v.getAttribute("data-src-720");
    if (lo && v.getAttribute("data-rung") === "1080") {
      attempt++;
      v.setAttribute("data-rung", "720");
      v.setAttribute("src", lo);
      v.load();
      if (started) tryPlay();
      return;
    }
    attempt++;
    v.setAttribute("data-hero-state", "error");
  });
  if (mm && mm.call(win, "(prefers-reduced-motion: reduce)").matches) {
    v.setAttribute("data-hero-state", "reduced");
    return;
  }
  var start = function () {
    // A poster that lands after hydration must not restart a hero the page
    // controller has paused: once it owns the element (data-state), it plays it.
    if (started || v.hasAttribute("data-state")) return;
    started = true;
    v.setAttribute("preload", "auto");
    tryPlay();
  };
  var poster = v.getAttribute("poster");
  if (poster) {
    var img = new win.Image();
    img.onload = start;
    img.onerror = start;
    img.src = poster;
    if (img.complete) start();
  } else {
    start();
  }
}
/* eslint-enable no-var */

/** The exact source embedded in the island; tests assert the island contains it. */
export const HERO_INIT_SOURCE = heroInit.toString();

// ── Pure budget policy ────────────────────────────────────────────────────────

export type VideoKind = "hero" | "stack";
export type BudgetState = "detached" | "attached" | "playing" | "blocked" | "paused";

export interface PolicyItem {
  id: string;
  kind: VideoKind;
  /** Distance from the viewport in viewport heights; 0 when intersecting. */
  distance: number;
  /** |element center - viewport center| in px; lower is closer. */
  centerOffset: number;
  state: BudgetState;
  /** Tap-to-pause (6B). Stays paused until tapped again. */
  userPaused: boolean;
}

export interface PolicyContext {
  reducedMotion: boolean;
  visible: boolean;
  /** Scroll-dim progress 0..1; the hero has priority while < 1. */
  scrollProgress: number;
}

export type PolicyAction = "detach" | "attach" | "play" | "pause" | "keep";

export const ATTACH_WITHIN_VIEWPORTS = 1;
export const RELEASE_BEYOND_VIEWPORTS = 2;

/**
 * Decides one action per registered video.
 *  - reduced motion: nothing plays; stack videos stay detached (posters only).
 *  - attach within one viewport, release beyond two; in between keep as-is.
 *  - exactly one plays: the intersecting, attached, unpaused, unblocked video
 *    closest to the viewport center. The hero wins while scrollProgress < 1.
 *  - hidden tab: everything pauses.
 */
export function decide(items: PolicyItem[], ctx: PolicyContext): Map<string, PolicyAction> {
  const out = new Map<string, PolicyAction>();

  if (ctx.reducedMotion) {
    for (const it of items) {
      if (it.kind === "stack") out.set(it.id, it.state === "detached" ? "keep" : "detach");
      else out.set(it.id, it.state === "playing" ? "pause" : "keep");
    }
    return out;
  }

  // Attach / release by distance.
  const attached = new Set<string>();
  for (const it of items) {
    const isAttached = it.state !== "detached";
    if (it.distance > RELEASE_BEYOND_VIEWPORTS) {
      out.set(it.id, isAttached ? "detach" : "keep");
      continue;
    }
    if (!isAttached && it.distance <= ATTACH_WITHIN_VIEWPORTS) {
      out.set(it.id, "attach");
      attached.add(it.id);
      continue;
    }
    if (isAttached) attached.add(it.id);
    out.set(it.id, "keep");
  }

  if (!ctx.visible) {
    for (const it of items) if (it.state === "playing") out.set(it.id, "pause");
    return out;
  }

  const candidates = items.filter(
    (it) => attached.has(it.id) && it.distance === 0 && !it.userPaused && it.state !== "blocked",
  );
  let winner: PolicyItem | undefined;
  if (ctx.scrollProgress < 1) winner = candidates.find((it) => it.kind === "hero");
  if (!winner) {
    winner = candidates.reduce<PolicyItem | undefined>((best, it) => {
      if (!best) return it;
      if (it.centerOffset < best.centerOffset) return it;
      if (it.centerOffset === best.centerOffset && it.kind === "hero") return it;
      return best;
    }, undefined);
  }

  for (const it of items) {
    if (!attached.has(it.id)) continue;
    if (winner && it.id === winner.id) {
      if (it.state !== "playing") out.set(it.id, "play");
      else out.set(it.id, "keep");
    } else if (it.state === "playing") {
      out.set(it.id, "pause");
    }
  }
  return out;
}

/** Geometry helper: distance in viewports and center offset for a rect. */
export function measure(rect: { top: number; bottom: number }, viewportHeight: number): { distance: number; centerOffset: number } {
  const vh = Math.max(1, viewportHeight);
  let distance = 0;
  if (rect.bottom < 0) distance = -rect.bottom / vh;
  else if (rect.top > vh) distance = (rect.top - vh) / vh;
  const center = (rect.top + rect.bottom) / 2;
  return { distance, centerOffset: Math.abs(center - vh / 2) };
}

/** Which rung to attach: 1080 on desktop when available, else 720. */
export function pickRung(src720: string, src1080: string | undefined, desktop: boolean): { src: string; rung: "720" | "1080" } {
  return desktop && src1080 ? { src: src1080, rung: "1080" } : { src: src720, rung: "720" };
}
