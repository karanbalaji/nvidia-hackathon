import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error bundler is supported in Next.js 16 runtime but not yet typed in NextConfig
  bundler: "webpack",
};

export default nextConfig;
