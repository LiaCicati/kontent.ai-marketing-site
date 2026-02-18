import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets-us-01.kc-usercontent.com",
      },
      {
        protocol: "https",
        hostname: "assets-eu-01.kc-usercontent.com",
      },
      {
        protocol: "https",
        hostname: "preview-assets-us-01.kc-usercontent.com",
      },
      {
        protocol: "https",
        hostname: "preview-assets-eu-01.kc-usercontent.com",
      },
    ],
  },
};

export default nextConfig;
