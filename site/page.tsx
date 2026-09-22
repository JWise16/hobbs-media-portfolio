import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CallingCard } from "@/components/CallingCard";
import { HomePage } from "@/components/HomePage";
import { findAgent } from "@/content/agents";
import { findProperty } from "@/content/properties";
import { brand } from "@/content/site";
import type { ThemeId } from "@/content/themes";
import { matchRoute, routeTitle, staticPaths } from "@/site/routes";

/**
 * Factory for /<theme>/[[...path]]/page.tsx. Each theme's page file is four
 * lines that bind the theme; everything else is shared.
 */
export interface PageProps {
  params: Promise<{ path?: string[] }>;
}

export function makeThemePage(theme: ThemeId) {
  async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { path } = await params;
    const match = matchRoute(path);
    if (!match) return {};
    const title = routeTitle(match);
    const isShare = match.kind !== "home";
    return {
      title: title ?? { absolute: brand.name },
      description:
        match.kind === "agent"
          ? `A calling card from ${brand.name}: real estate photo, film and aerial for Seattle listings.`
          : match.kind === "property"
            ? `${title}, filmed by ${brand.name}.`
            : undefined,
      // A "PREPARED FOR JESSICA" page must never be indexed, at any stage.
      robots: isShare ? { index: false, follow: false } : undefined,
    };
  }

  async function Page({ params }: PageProps) {
    const { path } = await params;
    const match = matchRoute(path);
    if (!match) notFound();

    if (match.kind === "home") return <HomePage theme={theme} />;

    if (match.kind === "agent") {
      const agent = findAgent(match.slug);
      if (!agent) notFound();
      return <CallingCard theme={theme} agent={agent} />;
    }

    const property = findProperty(match.slug);
    if (!property) notFound();
    const agent = property.agent ? findAgent(property.agent) : undefined;
    return <CallingCard theme={theme} property={property} agent={agent} />;
  }

  return {
    Page,
    generateMetadata,
    generateStaticParams: () => staticPaths(),
  };
}
