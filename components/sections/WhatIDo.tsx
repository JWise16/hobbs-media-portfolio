import { copy, services } from "@/content/site";
import { themes, type ThemeId } from "@/content/themes";

/**
 * What I do (mockup G, J; design 4A, 11A). Cinematic themes: h2 alone, then
 * hairline-separated title + sentence rows (three columns on desktop).
 * `hobbs` keeps the kicker and the 01/02/03 numerals as Sam built them.
 */
export function WhatIDo({ theme }: { theme: ThemeId }) {
  const t = themes[theme];
  return (
    <section id="what-i-do" className="section content" aria-labelledby="what-i-do-heading">
      {t.kickers ? <p className="tracked kicker">{copy.whatIDo.kicker}</p> : null}
      <h2 id="what-i-do-heading" className="display-h2 measure">
        {copy.whatIDo.headline}
      </h2>
      <ul className="services" data-numerals={t.numerals ? "1" : "0"}>
        {services.map((s, i) => (
          <li key={s.key} className="service hairline">
            {t.numerals ? <span className="service-numeral">{String(i + 1).padStart(2, "0")}</span> : null}
            <h3 className="service-title">{s.title}</h3>
            <p className="service-desc body-muted">{s.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
