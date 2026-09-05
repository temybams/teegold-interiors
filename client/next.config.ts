import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Without this Next walks up looking for a lockfile and picks a directory above the project.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
