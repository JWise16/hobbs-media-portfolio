import type { MetadataRoute } from "next";
import { launchTheme } from "@/content/config";
import { isReview } from "@/lib/stage";

/**
 * Review: nothing is indexable. Live: the home page only; /for/* and /p/*
 * (a "PREPARED FOR JESSICA" page) are never indexed. No sitemap for a one-URL site.
 */
export default function robots(): MetadataRoute.Robots {
  if (isReview()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  const base = launchTheme ? "" : "/dark";
  return {
    rules: {
      userAgent: "*",
      allow: [`${base}/$`, "/$"],
      disallow: ["/"],
    },
  };
}
