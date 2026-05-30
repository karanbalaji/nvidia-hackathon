import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@311pulse/agent", "@311pulse/contracts"],
  webpack: (config) => {
    // Resolve .js imports to .ts files — needed for ESM TypeScript workspace packages
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
