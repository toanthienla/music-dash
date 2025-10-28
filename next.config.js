/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  experimental: {
    middlewareClientMaxBodySize: 100 * 1024 * 1024, // 100 MB
  },

  // Rewrites for API proxy (bypass CORS)
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://musicplayer.blocktrend.xyz/api/v1/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
