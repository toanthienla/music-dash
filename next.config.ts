import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  webpack(config, { isServer }) {
    // Remove default SVG handling
    config.module.rules = config.module.rules.map((rule: any) => {
      if (rule.test?.toString().includes("svg")) {
        return {
          ...rule,
          test: /\.(png|jpg|jpeg|gif|webp|avif|ico|bmp)$/i,
        };
      }
      return rule;
    });

    // Add @svgr/webpack for SVG imports as React components
    config.module.rules.unshift({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  experimental: {
    middlewareClientMaxBodySize: 100 * 1024 * 1024, // 100 MB
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://musicplayer.blocktrend.xyz/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;