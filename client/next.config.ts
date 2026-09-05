import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Without this Next walks up looking for a lockfile and picks a directory above the project.
  outputFileTracingRoot: process.cwd(),
  // Hides the floating Next.js badge that sits over the page in development.
  devIndicators: false,
  transpilePackages: ['@teegold/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
