import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@repo/ui"],
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID,
    NEXT_PUBLIC_CESIUM_ION_TOKEN: process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN,
    NEXT_PUBLIC_CESIUM_MOON_ASSET_ID:
      process.env.NEXT_PUBLIC_CESIUM_MOON_ASSET_ID,
    NEXT_PUBLIC_CESIUM_MARS_ASSET_ID:
      process.env.NEXT_PUBLIC_CESIUM_MARS_ASSET_ID,
    NEXT_PUBLIC_GROUND_CODES_API_URL:
      process.env.NEXT_PUBLIC_GROUND_CODES_API_URL,
  },
  trailingSlash: true,
};

export default withNextIntl(nextConfig);
