import type { MetadataRoute } from "next";
import { launchTheme, reviewTheme } from "@/content/config";
import { isReview } from "@/lib/stage";

/**
 * Review: nothing is indexable. Live: the home page only; /for/* and /p/*
 * (a "PREPARED FOR JESSICA" page) are never indexed. No sitemap for a one-URL site.
 */
export default function robots(): MetadataRoute.Robots {
  if (isReview()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  // Next serves the home page without a trailing slash, so the allow must match
  // the exact path (`/dark$`), or after launch the bare root (`/$`).
  const home = launchTheme ? "/$" : `/${reviewTheme}$`;
  return {
    rules: {
      userAgent: "*",
      allow: [home],
      disallow: ["/"],
    },
  };
}
