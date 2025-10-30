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

  webpack: (config, { isServer }) => {
    // Find the existing SVG rule and disable it
    const imageRule = config.module.rules.find(
      (rule: any) => rule?.test?.toString().includes("svg")
    );

    if (imageRule) {
      imageRule.exclude = /\.svg$/i;
    }

    // Add SVGR webpack loader - MUST be FIRST
    config.module.rules.unshift({
      test: /\.svg$/i,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: false,
            titleProp: true,
            ref: true,
          },
        },
      ],
    });

    return config;
  },

  experimental: {
    middlewareClientMaxBodySize: 100 * 1024 * 1024, // 100 MB
  },
};

export default nextConfig;