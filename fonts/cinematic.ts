/**
 * Cinematic themes (dark, light, twilight): Instrument Serif display + Satoshi
 * support (design 12A). Imported only by those themes' layouts, so a page
 * requests exactly its own two families (D2).
 *
 * Satoshi is from Fontshare under the ITF Free Font License; files are
 * self-hosted in fonts/files/. Instrument Serif is OFL (Google Fonts).
 */
import localFont from "next/font/local";

export const display = localFont({
  src: "./files/InstrumentSerif-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-display",
  // The wordmark must never flash a fallback over footage.
  display: "block",
  preload: true,
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const support = localFont({
  src: [
    { path: "./files/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./files/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./files/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-support",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const fontClassName = `${display.variable} ${support.variable}`;
