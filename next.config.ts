import type { NextConfig } from "next";
import TerserPlugin from "terser-webpack-plugin";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "iotek.tn-cdn.net",
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // Handle SVG files
    const imageRule = config.module.rules.find(
      (rule: any) => rule?.test?.toString().includes("svg")
    );

    if (imageRule) {
      imageRule.exclude = /\.svg$/i;
    }

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

    // Properly configure TerserPlugin
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
              },
            },
          }),
        ],
      };
    }

    return config;
  },

  experimental: {
    middlewareClientMaxBodySize: 100 * 1024 * 1024, // 100 MB
  },
};

export default nextConfig;