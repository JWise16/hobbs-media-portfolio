import { contact, contactLinks, copy } from "@/content/site";

/**
 * EMAIL SAM (filled) plus the email as text, and the Instagram handle when
 * there is one. Shared by the contact section and the calling card so the
 * hrefs, labels and analytics hooks have one owner. There is no phone number
 * anywhere on the site (Sam's request, 2026-09-24).
 */
export function ContactActions({ variant }: { variant: "section" | "card" }) {
  const cls = variant === "section" ? "contact-buttons" : "beat-two-buttons";
  return (
    <div className={cls}>
      <a className="btn btn-primary" href={contactLinks.mailto()} data-event="email-sam">
        {copy.contact.emailSam}
      </a>
    </div>
  );
}

export function ContactLines({ variant }: { variant: "section" | "card" }) {
  const instagram = contactLinks.instagram();
  if (variant === "card") {
    return (
      <p className="beat-two-details body-muted">
        <a href={contactLinks.mailto()} className="tap">
          {contact.email}
        </a>
        {instagram ? (
          <a href={instagram} className="tap" rel="noopener">
            @{contact.instagram}
          </a>
        ) : null}
      </p>
    );
  }
  return (
    <p className="contact-lines">
      <a href={contactLinks.mailto()} className="tap contact-email">
        {contact.email}
      </a>
    </p>
  );
}
