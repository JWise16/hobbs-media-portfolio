import { copy } from "@/content/site";

/** One <footer> per page: the tracked brand line from mockup H. */
export function Footer({ onContactSurface = false }: { onContactSurface?: boolean }) {
  return (
    <footer className={`site-footer${onContactSurface ? " contact" : ""}`}>
      <p className="tracked tracked-xs body-muted site-footer-line">{copy.footerLine}</p>
    </footer>
  );
}
