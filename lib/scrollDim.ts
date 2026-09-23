/**
 * Scroll dim (design 8A, 13A motion row). The hero is 100svh sticky; the dim
 * runs over the first 0.6svh of scroll as the first section slides up over
 * it. Progress 1 at 0.6svh. One passive listener plus requestAnimationFrame.
 *
 * Progress is published as CSS variables on the hero root (`--p` raw,
 * `--pe` eased) and to subscribers (the header, the VideoBudget).
 */

export const DIM_TRAVEL = 0.6;

export function dimProgress(scrollY: number, viewportHeight: number, travel = DIM_TRAVEL): number {
  const span = Math.max(1, viewportHeight * travel);
  const p = scrollY / span;
  return p <= 0 ? 0 : p >= 1 ? 1 : p;
}

export function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

export interface DimSnapshot {
  progress: number;
  eased: number;
}

export function snapshot(scrollY: number, viewportHeight: number): DimSnapshot {
  const progress = dimProgress(scrollY, viewportHeight);
  return { progress, eased: easeOutCubic(progress) };
}

type Listener = (s: DimSnapshot) => void;

/**
 * A page-level store. `start()` attaches listeners once; `subscribe()` gets
 * the current value immediately and every change afterwards.
 */
export class ScrollDim {
  private listeners = new Set<Listener>();
  private raf = 0;
  private current: DimSnapshot = { progress: 0, eased: 0 };
  private started = false;
  private win: Window;

  constructor(win: Window = window) {
    this.win = win;
  }

  get value(): DimSnapshot {
    return this.current;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.win.addEventListener("scroll", this.schedule, { passive: true });
    this.win.addEventListener("resize", this.schedule, { passive: true });
    this.schedule();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.win.removeEventListener("scroll", this.schedule);
    this.win.removeEventListener("resize", this.schedule);
    if (this.raf) this.win.cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.current);
    return () => this.listeners.delete(fn);
  }

  /** Force a read (tests, and after client navigation). */
  measure(): DimSnapshot {
    const vh = this.win.innerHeight || this.win.document.documentElement.clientHeight;
    const next = snapshot(this.win.scrollY, vh);
    if (next.progress !== this.current.progress) {
      this.current = next;
      for (const fn of this.listeners) fn(next);
    }
    return next;
  }

  private schedule = () => {
    if (this.raf) return;
    this.raf = this.win.requestAnimationFrame(() => {
      this.raf = 0;
      this.measure();
    });
  };
}

let shared: ScrollDim | null = null;

export function scrollDim(): ScrollDim {
  if (!shared) shared = new ScrollDim();
  return shared;
}

/** Writes the CSS variables the hero and header styles read. */
export function applyDimVars(el: HTMLElement, s: DimSnapshot): void {
  el.style.setProperty("--p", s.progress.toFixed(4));
  el.style.setProperty("--pe", s.eased.toFixed(4));
  el.setAttribute("data-progress", s.progress >= 1 ? "1" : s.progress <= 0 ? "0" : "mid");
}
