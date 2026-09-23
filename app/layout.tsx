import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/content/config";
import { brand } from "@/content/site";
import { isReview } from "@/lib/stage";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  // Every route is noindex while the site is in review (eng 7A). Share links stay noindex at launch.
  robots: isReview() ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
