import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // We already ran type checking during local build
    ignoreBuildErrors: false,
  },
};

export default nextConfig;