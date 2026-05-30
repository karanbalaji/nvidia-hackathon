import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@311pulse/agent", "@311pulse/contracts"],
  // Turbopack resolves .js imports to .ts natively — no config needed.
  // The empty object silences the "webpack config without turbopack config" warning.
  turbopack: {},
};

export default nextConfig;
