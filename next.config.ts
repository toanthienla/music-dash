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

  webpack: (config, { isServer, dev }) => {
    if (!dev) {
      if (config.optimization?.minimizer) {
        config.optimization.minimizer.forEach((minimizer: any) => {
          if (minimizer.constructor.name === "TerserPlugin") {
            minimizer.options.terserOptions.compress.drop_console = true;
            minimizer.options.terserOptions.compress.drop_debugger = true;
          }
        });
      }
    }

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

    return config;
  },

  experimental: {
    middlewareClientMaxBodySize: 100 * 1024 * 1024, // 100 MB
  },
};

export default nextConfig;
