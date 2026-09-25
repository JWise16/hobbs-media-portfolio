import { ContactActions, ContactLines } from "@/components/ContactActions";
import { contact, contactLinks, copy } from "@/content/site";
import { themes, type ThemeId } from "@/content/themes";

/**
 * Get in touch (mockup H; design 4A, 5A, 7A). Opaque theme surface (hobbs:
 * Sam's dark contact surface via the --contact-* tokens). Filled TEXT SAM,
 * EMAIL SAM and the email as a mailto: link on every surface (no phone
 * number, Sam's request), then the facts. Hours render only when confirmed. No form.
 */
export function Contact({ theme }: { theme: ThemeId }) {
  const t = themes[theme];
  const labels = copy.contact.facts;
  const facts: Array<{ label: string; value: React.ReactNode }> = [
    { label: labels.basedIn, value: contact.basedIn },
    { label: labels.serving, value: contact.serving },
  ];
  const instagram = contactLinks.instagram();
  if (instagram) {
    facts.push({
      label: labels.instagram,
      value: (
        <a href={instagram} className="tap fact-link" rel="noopener">
          @{contact.instagram}
        </a>
      ),
    });
  }
  if (contact.hours) facts.push({ label: labels.hours, value: contact.hours });

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-heading">
      <div className="content contact-grid">
        <div className="contact-head">
          {t.kickers ? <p className="tracked kicker">{copy.contact.kicker}</p> : null}
          <h2 id="contact-heading" className="display-h2">
            {copy.contact.headline}
          </h2>
          <p className="measure contact-sentence">{copy.contact.sentence}</p>
        </div>
        <div className="contact-actions">
          <ContactActions variant="section" />
          <ContactLines variant="section" />
          <dl className="facts">
            {facts.map((f) => (
              <div key={f.label} className="fact">
                <dt className="tracked body-muted fact-label">{f.label}</dt>
                <dd className="fact-value">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
