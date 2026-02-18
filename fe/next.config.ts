import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    // @ts-ignore - turbopack root option is required for this setup
    turbopack: {
      root: path.resolve(process.cwd()),
    },
  },
};

export default nextConfig;
