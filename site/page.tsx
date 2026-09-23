import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CallingCard } from "@/components/CallingCard";
import { HomePage } from "@/components/HomePage";
import { findAgent } from "@/content/agents";
import { findProperty } from "@/content/properties";
import { brand } from "@/content/site";
import type { ThemeId } from "@/content/themes";
import { agentParams, propertyParams, routeTitle } from "@/site/routes";

/**
 * Factories for the per-theme route files. Each file in app/<theme>/ is a
 * handful of lines binding the theme; everything else is shared here.
 */

const noIndex: Metadata["robots"] = { index: false, follow: false };

export function makeHomeRoute(theme: ThemeId) {
  const metadata: Metadata = {
    title: { absolute: brand.name },
    description: brand.description,
  };
  function Page() {
    return <HomePage theme={theme} />;
  }
  return { Page, metadata };
}

export interface AgentProps {
  params: Promise<{ agent: string }>;
}

export function makeAgentRoute(theme: ThemeId) {
  async function generateMetadata({ params }: AgentProps): Promise<Metadata> {
    const agent = findAgent((await params).agent);
    if (!agent) return {};
    return {
      title: routeTitle({ kind: "agent", slug: agent.slug }),
      description: `A calling card from ${brand.name}: real estate photo, film and aerial for Seattle listings.`,
      // A "PREPARED FOR JESSICA" page must never be indexed, at any stage.
      robots: noIndex,
    };
  }
  async function Page({ params }: AgentProps) {
    const agent = findAgent((await params).agent);
    if (!agent) notFound();
    return <CallingCard theme={theme} agent={agent} />;
  }
  return { Page, generateMetadata, generateStaticParams: agentParams };
}

export interface PropertyProps {
  params: Promise<{ slug: string }>;
}

export function makePropertyRoute(theme: ThemeId) {
  async function generateMetadata({ params }: PropertyProps): Promise<Metadata> {
    const property = findProperty((await params).slug);
    if (!property) return {};
    return {
      title: routeTitle({ kind: "property", slug: property.slug }),
      description: `${property.title}, filmed by ${brand.name}.`,
      robots: noIndex,
    };
  }
  async function Page({ params }: PropertyProps) {
    const property = findProperty((await params).slug);
    if (!property) notFound();
    const agent = property.agent ? findAgent(property.agent) : undefined;
    return <CallingCard theme={theme} property={property} agent={agent} />;
  }
  return { Page, generateMetadata, generateStaticParams: propertyParams };
}
