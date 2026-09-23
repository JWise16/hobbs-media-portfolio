import { copy } from "@/content/site";

/**
 * 44px outlined circle, play glyph, "TAP TO PLAY" 11px tracked (state table
 * 5A). Visibility is driven by CSS from the video's data-state, so it works
 * before hydration when the island's play() is blocked.
 */
export function TapAffordance() {
  return (
    <span className="affordance" aria-hidden="true">
      <span className="affordance-ring">
        <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" aria-hidden="true">
          <path d="M1 1.5v13l12-6.5z" />
        </svg>
      </span>
      <span className="tracked">{copy.tapToPlay}</span>
    </span>
  );
}
