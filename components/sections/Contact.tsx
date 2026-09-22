import { contact, contactLinks, copy } from "@/content/site";
import { themes, type ThemeId } from "@/content/themes";

/**
 * Get in touch (mockup H; design 4A, 5A, 7A). Opaque theme surface (hobbs:
 * Sam's dark contact surface via the --contact-* tokens). Filled TEXT SAM,
 * outlined EMAIL SAM, phone as a tel: link and email as text on every
 * surface, then the facts. Hours render only when confirmed. No form.
 */
export function Contact({ theme }: { theme: ThemeId }) {
  const t = themes[theme];
  const facts: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Based in", value: contact.basedIn },
    { label: "Serving", value: contact.serving },
    {
      label: "Instagram",
      value: (
        <a href={contactLinks.instagram()} className="tap fact-link" rel="noopener">
          @{contact.instagram}
        </a>
      ),
    },
  ];
  if (contact.hours) facts.push({ label: "Hours", value: contact.hours });

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
          <div className="contact-buttons">
            <a className="btn btn-primary" href={contactLinks.sms()} data-event="text-sam">
              {copy.contact.textSam}
            </a>
            <a className="btn btn-secondary" href={contactLinks.mailto()} data-event="email-sam">
              {copy.contact.emailSam}
            </a>
          </div>
          <p className="contact-lines">
            <a href={contactLinks.tel()} className="tap tabular contact-phone">
              {contact.phoneDisplay}
            </a>
            <span className="contact-email">{contact.email}</span>
          </p>
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
