import type { NextConfig } from "next";
import { launchTheme, reviewTheme } from "./content/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Before a theme is chosen, reviewers open /<theme> and the bare root goes to
  // the mockup reference theme. Once `launchTheme` is set (design Next Steps 8)
  // the segment collapses: /<theme>/* 301s to /* (opengraph-image paths
  // exempted, since the og:image URLs keep their segment) and the rewrite below
  // serves /* from /<theme>/*.
  async redirects() {
    if (!launchTheme) return [{ source: "/", destination: `/${reviewTheme}`, permanent: false }];
    return [
      { source: `/${launchTheme}`, destination: "/", permanent: true },
      { source: `/${launchTheme}/:path((?!.*opengraph-image).*)`, destination: "/:path", permanent: true },
    ];
  },
  async rewrites() {
    if (!launchTheme) return { beforeFiles: [], afterFiles: [], fallback: [] };
    // fallback: only when no file, page, or dynamic route matched (so
    // /dark/for/x/opengraph-image is not rewritten onto itself). Everything
    // left over, including the bare root, is served from the launch theme.
    return { beforeFiles: [], afterFiles: [], fallback: [{ source: "/:path*", destination: `/${launchTheme}/:path*` }] };
  },
  async headers() {
    return [
      {
        // Every clip output carries its content hash in the name (8A), so it is immutable.
        source: "/clips/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  // 1A: the OG route reads posters and fonts from disk. Trace them into the
  // function so a request-time render (static generation skipped) still works.
  outputFileTracingIncludes: {
    "/**/opengraph-image": ["./public/clips/*.jpg", "./fonts/files/*.ttf"],
  },
  // The dynamic poster read would otherwise trace every mp4 into all twelve OG functions.
  outputFileTracingExcludes: {
    "/**/opengraph-image": ["./public/clips/*.mp4", "./fonts/files/*.woff2"],
  },
};

export default nextConfig;
