import Link from "next/link";
import { ContactActions, ContactLines } from "@/components/ContactActions";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/hero/Hero";
import { Wordmark } from "@/components/Wordmark";
import type { Agent } from "@/content/agents";
import { clips } from "@/content/clips.generated";
import type { Property } from "@/content/properties";
import { brand, contact, copy, heroClip } from "@/content/site";
import type { ThemeId } from "@/content/themes";
import { workHref } from "@/lib/href";
import { agentPlaque, nameLine, propertyPlaque } from "@/lib/plaque";

export interface CallingCardProps {
  theme: ThemeId;
  agent?: Agent;
  property?: Property;
}

/**
 * The two-beat calling card (/for/[agent], /p/[slug]; mockups I and C;
 * design 2A, 7A, 17A). Beat one: the reel with a personalized plaque whose
 * third line is the email as a mailto: link. Scroll dims the reel to 0.86 in the
 * theme surface; beat two ghosts over it: kicker PREPARED FOR, serif name
 * line, EMAIL SAM, details, one quiet link to the work. Share
 * links always render the cinematic hero regardless of theme.
 */
export function CallingCard({ theme, agent, property }: CallingCardProps) {
  const clip = clips[property?.reel ?? heroClip];
  const plaque = property
    ? propertyPlaque(property, agent, contact.email)
    : agentPlaque(agent!, contact.email);
  const title = property ? property.title : `${brand.name} for ${agent!.displayName}`;
  const name = agent ? nameLine(agent) : property!.title;

  return (
    <>
      <Header theme={theme} mode="on-progress" />
      <main>
        <Hero theme={theme} clip={clip} plaque={plaque} variant="card" title={title} />
        <section className="beat-two" aria-labelledby="card-heading">
          <div className="beat-two-inner">
            <Wordmark theme={theme} size="card" />
            <p className="tracked kicker beat-two-kicker">{copy.preparedFor}</p>
            <h2 id="card-heading" className="beat-two-name">
              {name}
            </h2>
            {property?.address ? <p className="beat-two-address">{property.address}</p> : null}
            <ContactActions variant="card" />
            <ContactLines variant="card" />
            <Link href={workHref(theme)} className="tracked tap beat-two-work">
              {copy.selectedWork} →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
