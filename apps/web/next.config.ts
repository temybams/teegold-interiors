import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@teegold/shared'],
  // Next otherwise walks up past the repo looking for a lockfile and picks the wrong root.
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
};

export default nextConfig;
