import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
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

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

export default nextConfig;
