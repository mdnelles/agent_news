import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Next.js from picking up /Users/mnells/package-lock.json as the monorepo root
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
