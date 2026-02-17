import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/flooring-price-dashboard",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
