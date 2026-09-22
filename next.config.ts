import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Reviewers open /<theme>; the bare root goes to the mockup reference theme.
  async redirects() {
    return [{ source: "/", destination: "/dark", permanent: false }];
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
};

export default nextConfig;
