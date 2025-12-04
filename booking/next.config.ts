import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  typescript: {
    // We already ran type checking during local build
    ignoreBuildErrors: false,
  },
};

export default nextConfig;