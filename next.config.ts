import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray parent-directory lockfile does not
  // confuse Turbopack's root inference.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
