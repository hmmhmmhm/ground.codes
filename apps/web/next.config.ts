import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@repo/ui"],
  output: "export",
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for Cloudflare Pages compatibility
  trailingSlash: true,
};

export default nextConfig;
