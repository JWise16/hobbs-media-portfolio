import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { findAgent } from "@/content/agents";
import { clips, type ClipId } from "@/content/clips.generated";
import { findProperty } from "@/content/properties";
import { brand, contact, heroClip, homePlaque } from "@/content/site";
import { themes, type ThemeId } from "@/content/themes";
import type { ClipEntry } from "@/lib/clips.types";
import { agentParams, propertyParams, type RouteMatch } from "@/site/routes";

/**
 * Per-route OpenGraph image (eng 1A, T1; design 10A): poster frame, the
 * two-tone wordmark, one plaque line. Rendered at build with
 * `force-static`; the poster and fonts are read from disk (never fetched)
 * so a request-time render inside the traced function works too.
 *
 * Fonts are TTF: satori does not read woff2. Instrument Serif (OFL) plus the
 * theme's support face at 500.
 */

export const OG_SIZE = { width: 1200, height: 630 };

/** Literal colors are allowed here only: this is a rasterized image, not a component. */
const palette: Record<ThemeId, { text: string; muted: string; plaque: string; dim: string }> = {
  dark: { text: "#F3EFE6", muted: "#8C9BB0", plaque: "#F3EFE6", dim: "rgba(11,13,18,0.35)" },
  light: { text: "#F3EFE6", muted: "#C9C2B6", plaque: "#F3EFE6", dim: "rgba(42,38,33,0.30)" },
  twilight: { text: "#EFE6D6", muted: "#C9A24A", plaque: "#EFE6D6", dim: "rgba(18,16,14,0.35)" },
  hobbs: { text: "#F3EFE6", muted: "#7E8CA0", plaque: "#F3EFE6", dim: "rgba(20,20,20,0.35)" },
};

export async function readFont(file: string): Promise<ArrayBuffer> {
  const p = path.join(process.cwd(), "fonts/files", file);
  let buf: Buffer;
  try {
    buf = await fs.readFile(p);
  } catch {
    // Missing font files fail the build (failure-modes table: OG route, fonts missing).
    throw new Error(`OG image font missing: ${p}`);
  }
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/** Read from disk at build time and traced into the function (1A). */
export async function posterDataUrl(publicPath: string): Promise<string> {
  const p = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  const buf = await fs.readFile(p);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

export function ogPlaqueLine(match: RouteMatch): { clipId: ClipId; line: string } {
  if (match.kind === "agent") {
    const a = findAgent(match.slug);
    return { clipId: heroClip, line: a ? `PREPARED FOR ${a.displayName.toUpperCase()}` : homePlaque[0] };
  }
  if (match.kind === "property") {
    const p = findProperty(match.slug);
    if (!p) return { clipId: heroClip, line: homePlaque[0] };
    const a = p.agent ? findAgent(p.agent) : undefined;
    return { clipId: p.reel ?? heroClip, line: a ? `${p.title.toUpperCase()} · FOR ${a.displayName.toUpperCase()}` : p.title.toUpperCase() };
  }
  // Share links keep personalization in the plaque; the trade goes in the OG line (10A).
  return { clipId: heroClip, line: homePlaque[0] };
}

export async function renderOg(theme: ThemeId, match: RouteMatch): Promise<ImageResponse> {
  const t = themes[theme];
  const colors = palette[theme];
  const { clipId, line } = ogPlaqueLine(match);
  const clip: ClipEntry = clips[clipId];
  const [serif, support, poster] = await Promise.all([
    readFont("InstrumentSerif-Regular.ttf"),
    readFont(t.support === "manrope" ? "Manrope-Medium.ttf" : "Satoshi-Medium.ttf"),
    posterDataUrl(clip.files.poster_1920 ?? clip.files.poster),
  ]);
  const objectPosition = `${Math.round(clip.focal.x * 100)}% ${Math.round(clip.focal.y * 100)}%`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0B0D12" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: colors.dim, display: "flex" }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(0,0,0,0.38), rgba(0,0,0,0))",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 26,
          }}
        >
          <div style={{ display: "flex", fontFamily: "Instrument Serif", fontSize: 112, lineHeight: 1, color: colors.text }}>
            <span>{brand.wordmark.word}</span>
            <span style={{ color: colors.muted, marginLeft: 26 }}>{brand.wordmark.rest}</span>
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Support",
              fontSize: 22,
              letterSpacing: "0.28em",
              color: colors.plaque,
              textTransform: "uppercase",
            }}
          >
            {line}
          </div>
        </div>
        <div style={{ position: "absolute", left: 48, bottom: 40, display: "flex", fontFamily: "Support", fontSize: 18, letterSpacing: "0.2em", color: colors.plaque, opacity: 0.8 }}>
          {contact.phoneDisplay}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
        { name: "Support", data: support, weight: 500, style: "normal" },
      ],
    },
  );
}

export function makeHomeOg(theme: ThemeId) {
  return { Image: () => renderOg(theme, { kind: "home" }) };
}

export function makeAgentOg(theme: ThemeId) {
  return {
    Image: async ({ params }: { params: Promise<{ agent: string }> }) => renderOg(theme, { kind: "agent", slug: (await params).agent }),
    generateStaticParams: agentParams,
  };
}

export function makePropertyOg(theme: ThemeId) {
  return {
    Image: async ({ params }: { params: Promise<{ slug: string }> }) => renderOg(theme, { kind: "property", slug: (await params).slug }),
    generateStaticParams: propertyParams,
  };
}
