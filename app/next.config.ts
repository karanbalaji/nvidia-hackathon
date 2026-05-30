import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@311pulse/agent", "@311pulse/contracts"],
};

export default nextConfig;
