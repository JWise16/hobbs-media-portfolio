import type { Plaque as PlaqueLines } from "@/lib/plaque";

/**
 * Three tracked-caps lines on the hero (10A, 17A). A line with `href` renders
 * as a link with a 44px tap height (2A). Color is a token at full opacity, never alpha.
 */
export function Plaque({ lines, className = "" }: { lines: PlaqueLines; className?: string }) {
  return (
    <p className={`plaque tracked-plaque ${className}`.trim()}>
      {lines.map((line, i) =>
        line.href ? (
          <a key={i} href={line.href} className="plaque-line plaque-link">
            {line.text}
          </a>
        ) : (
          <span key={i} className="plaque-line">
            {line.text}
          </span>
        ),
      )}
    </p>
  );
}
