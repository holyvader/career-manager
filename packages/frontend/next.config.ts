import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  cacheComponents: true,
  typedRoutes: true,
  // Produces a minimal, self-contained `.next/standalone` server for Docker
  // (see packages/frontend/Dockerfile) instead of requiring the full
  // node_modules tree in the runtime image.
  output: 'standalone',
  // This is a Bun workspace monorepo - without this, Next's file tracing
  // only looks inside packages/frontend and misses the hoisted root
  // node_modules, producing an incomplete standalone build.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
};

export default nextConfig;
