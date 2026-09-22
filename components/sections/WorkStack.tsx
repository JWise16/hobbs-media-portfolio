import Image from "next/image";
import { StackFrame } from "@/components/StackFrame";
import { clips } from "@/content/clips.generated";
import { copy } from "@/content/site";
import { themes, type ThemeId } from "@/content/themes";
import { vocabulary } from "@/content/vocabulary";
import { work } from "@/content/work";
import { isReview } from "@/lib/stage";

/**
 * Selected work (mockups A and J, design 4A, 5A, 11A, 14A). A vertical stack
 * of full-width clips that play as you scroll, one at a time. Photography
 * entries render as a static frame via next/image. Empty work[] renders
 * nothing and #work anchors to the top of the sections.
 */
export function WorkStack({ theme }: { theme: ThemeId }) {
  if (work.length === 0) return <div id="work" />;
  const t = themes[theme];
  const review = isReview();
  return (
    <section id="work" className="section content" aria-labelledby="work-heading">
      {t.kickers ? <p className="tracked kicker">{copy.work.kicker}</p> : null}
      <h2 id="work-heading" className="display-h2">
        {copy.work.headline}
      </h2>
      <p className="tracked body-muted work-subline">{copy.work.subline}</p>
      <div className="stack">
        {work.map((item) => {
          const tag = vocabulary[item.tag].short;
          if ("clip" in item.media) {
            const clip = clips[item.media.clip];
            return (
              <StackFrame
                key={item.slug}
                clip={clip}
                title={item.title}
                subtitle={item.subtitle}
                tag={tag}
                pending={review && !clip.approved}
                pendingLabel={copy.pending}
              />
            );
          }
          return (
            <figure key={item.slug} className="frame frame-still" tabIndex={0} aria-label={item.title}>
              <div className="frame-box">
                <Image src={item.media.image} alt={item.media.alt} fill sizes="100vw" className="frame-poster" />
                <div className="frame-scrim" aria-hidden="true" />
                <span className="chip frame-chip">{tag}</span>
                <figcaption className="frame-caption">
                  <h3 className="frame-title">{item.title}</h3>
                  <p className="tracked frame-subtitle">{item.subtitle}</p>
                </figcaption>
              </div>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
