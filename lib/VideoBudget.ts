/**
 * VideoBudget (eng 5A, T3, T4; design 6B): one page-level controller that
 * registers every <video>, including the hero island, and applies the pure
 * policy in playbackPolicy.ts on scroll, resize, and visibility changes.
 *
 *   attach `src` within one viewport, release beyond two, only the clip
 *   closest to the viewport center plays, the hero has priority while the
 *   scroll-dim progress is below 1. play() rejection → BLOCKED (tap
 *   affordance). prefers-reduced-motion → posters only. visibilitychange →
 *   pause all. Tap or Space toggles a user pause with no visible chrome.
 */
import {
  DESKTOP_QUERY,
  REDUCED_MOTION_QUERY,
  decide,
  heroInit,
  measure,
  pickRung,
  type BudgetState,
  type PolicyItem,
  type VideoKind,
} from "./playbackPolicy";

export interface Registration {
  el: HTMLVideoElement;
  kind: VideoKind;
  src720: string;
  src1080?: string;
  loop: boolean;
  /**
   * Geometry override. The home hero is sticky, so its element rect never
   * leaves the viewport; it passes its flow position instead. Share links keep
   * the default (the reel keeps looping under beat two).
   */
  rect?: () => { top: number; bottom: number };
}

interface Entry extends Registration {
  id: string;
  state: BudgetState;
  userPaused: boolean;
  /** Incremented on every play()/pause() so a stale rejection (AbortError from an interrupting pause) is ignored. */
  playToken: number;
  /** The media element reported an error; excluded from play candidates until a tap retries. */
  errored: boolean;
  /** The 1080 rung failed and the 720 rung was substituted once. */
  fellBack: boolean;
  onError: () => void;
}

export interface VideoBudgetOptions {
  win?: Window;
}

export class VideoBudget {
  private entries = new Map<HTMLVideoElement, Entry>();
  private win: Window;
  private raf = 0;
  private seq = 0;
  private started = false;
  private scrollProgress = 0;
  private reduced: MediaQueryList | null = null;
  private desktop: MediaQueryList | null = null;

  constructor(opts: VideoBudgetOptions = {}) {
    this.win = opts.win ?? window;
  }

  /** Hero priority input; the hero controller feeds the scroll-dim progress here. */
  setScrollProgress(p: number): void {
    if (p === this.scrollProgress) return;
    this.scrollProgress = p;
    this.schedule();
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    const w = this.win;
    this.reduced = w.matchMedia ? w.matchMedia(REDUCED_MOTION_QUERY) : null;
    this.desktop = w.matchMedia ? w.matchMedia(DESKTOP_QUERY) : null;
    w.addEventListener("scroll", this.schedule, { passive: true });
    w.addEventListener("resize", this.schedule, { passive: true });
    w.document.addEventListener("visibilitychange", this.schedule);
    this.reduced?.addEventListener?.("change", this.schedule);
    this.schedule();
  }

  destroy(): void {
    const w = this.win;
    w.removeEventListener("scroll", this.schedule);
    w.removeEventListener("resize", this.schedule);
    w.document.removeEventListener("visibilitychange", this.schedule);
    this.reduced?.removeEventListener?.("change", this.schedule);
    if (this.raf) w.cancelAnimationFrame(this.raf);
    for (const el of [...this.entries.keys()]) this.unregister(el);
    this.started = false;
  }

  register(reg: Registration): () => void {
    const el = reg.el;
    if (this.entries.has(el)) return () => this.unregister(el);
    const entry: Entry = {
      ...reg,
      id: `${reg.kind}-${++this.seq}`,
      state: "detached",
      userPaused: false,
      playToken: 0,
      errored: false,
      fellBack: false,
      onError: () => {
        // A broken 1080 file falls back to the 720 rung once (the island does the same pre-hydration).
        if (el.getAttribute("data-rung") === "1080" && !entry.fellBack) {
          entry.fellBack = true;
          el.setAttribute("src", reg.src720);
          el.setAttribute("data-rung", "720");
          el.load();
          this.setState(entry, "attached");
          this.schedule();
          return;
        }
        // Clip 404 or decode error after the poster: stay on the poster, log, nothing else changes.
        if (typeof console !== "undefined") console.warn("[VideoBudget] video error", reg.src720);
        entry.errored = true;
        this.setState(entry, "attached");
      },
    };
    el.addEventListener("error", entry.onError);
    // React does not serialize `muted`; the property is what play() checks.
    el.muted = true;
    el.defaultMuted = true;

    if (reg.kind === "hero") {
      // Island init on client navigation (T3): innerHTML-inserted scripts never run.
      if (el.getAttribute("data-hero-init") !== "1") heroInit(el);
      entry.state = this.heroStateFromIsland(el);
    }
    this.entries.set(el, entry);
    this.setState(entry, entry.state);
    this.schedule();
    return () => this.unregister(el);
  }

  unregister(el: HTMLVideoElement): void {
    const entry = this.entries.get(el);
    if (!entry) return;
    el.removeEventListener("error", entry.onError);
    if (entry.state === "playing") el.pause();
    this.entries.delete(el);
  }

  /** Tap-to-pause (6B). Returns the new user-paused flag. */
  toggle(el: HTMLVideoElement): boolean {
    const entry = this.entries.get(el);
    if (!entry) return false;
    if (entry.state === "blocked" || entry.errored) {
      // Blocked: the tap is the user gesture iOS wanted. Try again.
      entry.userPaused = false;
      entry.errored = false;
      this.play(entry);
      return false;
    }
    entry.userPaused = !entry.userPaused;
    if (entry.userPaused) {
      if (entry.state === "playing") {
        entry.playToken++;
        el.pause();
      }
      this.setState(entry, "paused");
    } else {
      this.setState(entry, entry.el.getAttribute("src") ? "attached" : "detached");
    }
    this.schedule();
    return entry.userPaused;
  }

  /** Current states, for tests and debugging. */
  states(): Array<{ el: HTMLVideoElement; state: BudgetState; userPaused: boolean }> {
    return [...this.entries.values()].map((e) => ({ el: e.el, state: e.state, userPaused: e.userPaused }));
  }

  /** Runs the policy now (tests call this instead of waiting for a frame). */
  update(): void {
    const w = this.win;
    const vh = w.innerHeight || w.document.documentElement.clientHeight || 1;
    const items: PolicyItem[] = [];
    for (const e of this.entries.values()) {
      const rect = e.rect ? e.rect() : e.el.getBoundingClientRect();
      const m = measure(rect, vh);
      items.push({
        id: e.id,
        kind: e.kind,
        distance: m.distance,
        centerOffset: m.centerOffset,
        // An errored element never wins; it keeps its poster until a tap retries.
        state: e.errored && e.state !== "detached" ? "blocked" : e.state,
        userPaused: e.userPaused,
      });
    }
    const actions = decide(items, {
      reducedMotion: !!this.reduced?.matches,
      visible: w.document.visibilityState !== "hidden",
      scrollProgress: this.scrollProgress,
    });
    for (const e of this.entries.values()) {
      const a = actions.get(e.id) ?? "keep";
      if (a === "attach") this.attach(e);
      else if (a === "detach") this.detach(e);
      else if (a === "play") this.play(e);
      else if (a === "pause") this.pause(e);
    }
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private schedule = () => {
    if (!this.started || this.raf) return;
    this.raf = this.win.requestAnimationFrame(() => {
      this.raf = 0;
      this.update();
    });
  };

  private heroStateFromIsland(el: HTMLVideoElement): BudgetState {
    const s = el.getAttribute("data-hero-state");
    if (s === "playing") return "playing";
    if (s === "blocked") return "blocked";
    return "attached";
  }

  private setState(e: Entry, s: BudgetState): void {
    e.state = s;
    e.el.setAttribute("data-state", s);
  }

  private attach(e: Entry): void {
    const { src, rung } = pickRung(e.src720, e.src1080, !!this.desktop?.matches);
    if (e.el.getAttribute("src") !== src) {
      e.el.setAttribute("src", src);
      e.el.setAttribute("data-rung", rung);
      // Metadata only: enough for the first frame; play() bumps to auto. Keeps
      // attached-but-idle clips from downloading in full on cellular.
      e.el.setAttribute("preload", "metadata");
      if (e.loop) e.el.setAttribute("loop", "");
      e.el.load();
    }
    this.setState(e, e.userPaused ? "paused" : "attached");
  }

  private detach(e: Entry): void {
    e.playToken++;
    if (e.state === "playing") e.el.pause();
    e.errored = false;
    e.fellBack = false;
    e.el.removeAttribute("src");
    e.el.setAttribute("preload", "none");
    e.el.load();
    this.setState(e, "detached");
  }

  private play(e: Entry): void {
    if (!e.el.getAttribute("src")) this.attach(e);
    e.el.setAttribute("preload", "auto");
    const token = ++e.playToken;
    let p: Promise<void> | void;
    try {
      p = e.el.play();
    } catch (err) {
      p = Promise.reject(err instanceof Error ? err : new Error("play threw"));
    }
    // Optimistic: the policy treats a pending play() as playing so the next
    // frame never calls play() twice. Only a rejection for THIS attempt counts:
    // a pause() that interrupts a pending play() rejects the old promise with
    // AbortError, and that must not mark the clip blocked.
    this.setState(e, "playing");
    if (p && typeof (p as Promise<void>).then === "function") {
      (p as Promise<void>).then(
        () => {
          if (this.entries.get(e.el) === e && e.playToken === token && e.userPaused) this.setState(e, "paused");
        },
        (err: unknown) => {
          if (this.entries.get(e.el) !== e || e.playToken !== token || e.state !== "playing") return;
          const name = (err as { name?: string } | null)?.name;
          // A fresh AbortError means our own load() interrupted this attempt: harmless,
          // the next frame retries. Anything else (NotAllowedError in Low Power Mode,
          // a synchronous throw) needs a tap, so it is blocked and never retried in a loop.
          this.setState(e, name === "AbortError" ? "attached" : "blocked");
        },
      );
    }
  }

  private pause(e: Entry): void {
    e.playToken++;
    e.el.pause();
    this.setState(e, e.userPaused ? "paused" : "attached");
  }
}

let shared: VideoBudget | null = null;

/** The page-level singleton (one decoder policy per page). */
export function videoBudget(): VideoBudget {
  if (!shared) {
    shared = new VideoBudget();
    shared.start();
  }
  return shared;
}
