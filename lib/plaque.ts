import type { Agent } from "@/content/agents";
import type { Property } from "@/content/properties";

/**
 * Plaque composition and limits (design 17A, 10A).
 *
 *   home:  REAL ESTATE PHOTO · FILM · AERIAL / SEATTLE & PUGET SOUND / FAA PART 107 CERTIFIED
 *   /for/: PREPARED FOR {DISPLAYNAME} / {BROKERAGE} / {PHONE}
 *   /p/:   {PROPERTY TITLE} / PREPARED FOR {DISPLAYNAME} / {PHONE}
 *
 * Any composed line is at most 32 characters. Over-limit fails the build
 * naming the string (scripts/guard.ts).
 */

export const LIMITS = {
  displayName: 24,
  brokerage: 20,
  propertyTitle: 28,
  plaqueLine: 32,
  address: 40,
} as const;

export interface PlaqueLine {
  text: string;
  /** Rendered as a tel: link with a 44px tap height (2A). */
  tel?: string;
}

export type Plaque = readonly [PlaqueLine, PlaqueLine, PlaqueLine];

export function homePlaqueLines(lines: readonly [string, string, string]): Plaque {
  return [{ text: lines[0] }, { text: lines[1] }, { text: lines[2] }];
}

export function agentPlaque(agent: Agent, phoneDisplay: string, phoneE164: string): Plaque {
  return [
    { text: `PREPARED FOR ${agent.displayName.toUpperCase()}` },
    { text: (agent.brokerage ?? "").toUpperCase() },
    { text: phoneDisplay, tel: `tel:${phoneE164}` },
  ];
}

export function propertyPlaque(property: Property, agent: Agent | undefined, phoneDisplay: string, phoneE164: string): Plaque {
  return [
    { text: property.title.toUpperCase() },
    { text: agent ? `PREPARED FOR ${agent.displayName.toUpperCase()}` : "" },
    { text: phoneDisplay, tel: `tel:${phoneE164}` },
  ];
}

/** Beat two name line: "{displayName} · {brokerage}" with no dangling dot. */
export function nameLine(agent: Agent): string {
  return agent.brokerage ? `${agent.displayName} · ${agent.brokerage}` : agent.displayName;
}

export interface LimitViolation {
  what: string;
  value: string;
  length: number;
  limit: number;
}

export function checkAgentLimits(agent: Agent): LimitViolation[] {
  const v: LimitViolation[] = [];
  if (agent.displayName.length > LIMITS.displayName) {
    v.push({ what: `agents[${agent.slug}].displayName`, value: agent.displayName, length: agent.displayName.length, limit: LIMITS.displayName });
  }
  if (agent.brokerage && agent.brokerage.length > LIMITS.brokerage) {
    v.push({ what: `agents[${agent.slug}].brokerage`, value: agent.brokerage, length: agent.brokerage.length, limit: LIMITS.brokerage });
  }
  return v;
}

export function checkPropertyLimits(property: Property): LimitViolation[] {
  const v: LimitViolation[] = [];
  if (property.title.length > LIMITS.propertyTitle) {
    v.push({ what: `properties[${property.slug}].title`, value: property.title, length: property.title.length, limit: LIMITS.propertyTitle });
  }
  if (property.address && property.address.length > LIMITS.address) {
    v.push({ what: `properties[${property.slug}].address`, value: property.address, length: property.address.length, limit: LIMITS.address });
  }
  return v;
}

export function checkPlaqueLimits(what: string, plaque: Plaque): LimitViolation[] {
  return plaque.flatMap((line, i) =>
    line.text.length > LIMITS.plaqueLine
      ? [{ what: `${what} line ${i + 1}`, value: line.text, length: line.text.length, limit: LIMITS.plaqueLine }]
      : [],
  );
}
