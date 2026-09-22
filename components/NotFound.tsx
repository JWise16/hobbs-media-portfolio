import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { contactLinks, copy } from "@/content/site";
import type { ThemeId } from "@/content/themes";
import { homeHref } from "@/lib/href";

/** Themed 404 (state table 5A): wordmark, "That link isn't live.", TEXT SAM, home link. */
export function NotFound({ theme }: { theme: ThemeId }) {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center text-center content gap-8">
      <Wordmark theme={theme} size="card" />
      <h1 className="display-h2" style={{ marginTop: 0 }}>
        {copy.notFound.headline}
      </h1>
      <div className="flex flex-col gap-3 w-full max-w-[420px] items-center">
        <a className="btn btn-primary" href={contactLinks.sms()}>
          {copy.contact.textSam}
        </a>
        <Link className="tracked tap px-2 body-muted" href={homeHref(theme)}>
          {copy.notFound.home}
        </Link>
      </div>
    </main>
  );
}
