import type { Plaque as PlaqueLines } from "@/lib/plaque";

/**
 * Three tracked-caps lines on the hero (10A, 17A). A `tel` line renders as a
 * link with a 44px tap height (2A). Color is a token at full opacity, never alpha.
 */
export function Plaque({ lines, className = "" }: { lines: PlaqueLines; className?: string }) {
  return (
    <p className={`plaque tracked-plaque ${className}`.trim()}>
      {lines.map((line, i) =>
        line.tel ? (
          <a key={i} href={line.tel} className="plaque-line plaque-tel tabular">
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
