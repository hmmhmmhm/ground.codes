import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
};

export default withNextIntl(nextConfig);
