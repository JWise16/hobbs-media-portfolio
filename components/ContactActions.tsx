import { contact, contactLinks, copy } from "@/content/site";

/**
 * TEXT SAM (filled) and EMAIL SAM (outlined) plus the phone as a tel: link
 * and the email as text. Shared by the contact section and the calling card
 * so the hrefs, labels and analytics hooks have one owner.
 */
export function ContactActions({ variant }: { variant: "section" | "card" }) {
  const cls = variant === "section" ? "contact-buttons" : "beat-two-buttons";
  return (
    <div className={cls}>
      <a className="btn btn-primary" href={contactLinks.sms()} data-event="text-sam">
        {copy.contact.textSam}
      </a>
      <a className="btn btn-secondary" href={contactLinks.mailto()} data-event="email-sam">
        {copy.contact.emailSam}
      </a>
    </div>
  );
}

export function ContactLines({ variant }: { variant: "section" | "card" }) {
  if (variant === "card") {
    return (
      <p className="beat-two-details body-muted">
        <a href={contactLinks.tel()} className="tap tabular">
          {contact.phoneDisplay}
        </a>
        <span>{contact.email}</span>
        <a href={contactLinks.instagram()} className="tap" rel="noopener">
          @{contact.instagram}
        </a>
      </p>
    );
  }
  return (
    <p className="contact-lines">
      <a href={contactLinks.tel()} className="tap tabular contact-phone">
        {contact.phoneDisplay}
      </a>
      <span className="contact-email">{contact.email}</span>
    </p>
  );
}
