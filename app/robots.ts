import type { MetadataRoute } from "next";

/**
 * Indexing is controlled by the `robots` meta on each page: every route is
 * noindex in review, and /for/* and /p/* (a "PREPARED FOR JESSICA" page) stay
 * noindex at launch. Crawling is allowed everywhere on purpose: a crawler can
 * only honour noindex on a page it is allowed to fetch, and a disallowed URL
 * that is linked from elsewhere can still be listed. No sitemap for a one-URL site.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } };
}
