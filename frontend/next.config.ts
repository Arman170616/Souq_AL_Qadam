import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'bdshoe.com' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: '66.154.113.120' },
    ],
  },
};

export default nextConfig;
