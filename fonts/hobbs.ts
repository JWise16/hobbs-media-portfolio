/**
 * `hobbs` theme: Instrument Serif display + Manrope support, matching Sam's
 * Lovable build (design 12A). Imported only by app/hobbs/layout.tsx.
 */
import localFont from "next/font/local";

export const display = localFont({
  src: "./files/InstrumentSerif-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-display",
  display: "block",
  preload: true,
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const support = localFont({
  src: "./files/Manrope-Variable.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-support",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const fontClassName = `${display.variable} ${support.variable}`;
