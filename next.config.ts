import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js bundler from relocating the Sparticuz chromium binary
  serverExternalPackages: ['@sparticuz/chromium', 'playwright-core'],
};

export default nextConfig;
