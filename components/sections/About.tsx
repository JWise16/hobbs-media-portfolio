import { copy, stats, statsConfirmed } from "@/content/site";
import { themes, type ThemeId } from "@/content/themes";

/**
 * About (design 4A, 5A, 9A). The headline carries the delivery facts; Sam's
 * paragraphs sit beneath. The stats row renders only when all three stats are
 * confirmed; with one or two confirmed the row is omitted.
 */
export function About({ theme }: { theme: ThemeId }) {
  const t = themes[theme];
  return (
    <section id="about" className="section content" aria-labelledby="about-heading">
      <div className="about-grid">
        <div className="about-head">
          {t.kickers ? <p className="tracked kicker">{copy.about.kicker}</p> : null}
          <h2 id="about-heading" className="display-h2">
            {copy.about.headline}
          </h2>
        </div>
        <div className="about-body">
          {copy.about.paragraphs.map((p, i) => (
            <p key={i} className="measure about-p">
              {p}
            </p>
          ))}
          {statsConfirmed ? (
            <dl className="stats hairline">
              {stats.map((s) => (
                <div key={s.label} className="stat">
                  <dd className="stat-value">{s.value}</dd>
                  <dt className="tracked stat-label body-muted">{s.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}
