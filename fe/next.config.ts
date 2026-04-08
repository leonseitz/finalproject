import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    // @ts-ignore - turbopack resolveAlias for correct tailwindcss module path
    turbopack: {
      resolveAlias: {
        tailwindcss: path.join(__dirname, "node_modules/tailwindcss/index.css"),
      },
    },
  },
};

export default nextConfig;
