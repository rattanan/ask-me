import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.68.106", "localhost", "127.0.0.1"],
  output: "standalone",
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", port: "", pathname: "/**" },
    ],
  },
};

export default nextConfig;
