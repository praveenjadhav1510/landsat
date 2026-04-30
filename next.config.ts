import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent the bundler from inlining/relocating @sparticuz/chromium and playwright-core.
  // These packages use relative path resolution (bin/) that breaks when bundled.
  // serverExternalPackages is the correct config for both Turbopack (Next.js 16+) and webpack.
  serverExternalPackages: ['@sparticuz/chromium', 'playwright-core'],

  // Next.js 16 uses Turbopack by default. An empty turbopack config acknowledges this
  // and silences the "webpack config with no turbopack config" build warning.
  turbopack: {},
};

export default nextConfig;
