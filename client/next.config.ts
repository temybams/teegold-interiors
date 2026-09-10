import type { NextConfig } from 'next';

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(
  /\/$/,
  '',
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Without this Next walks up looking for a lockfile and picks a directory above the project.
  outputFileTracingRoot: process.cwd(),
  // Hides the floating Next.js badge that sits over the page in development.
  devIndicators: false,
  transpilePackages: ['@teegold/shared'],
  // Browser talks to same-origin `/api/*` so auth cookies are first-party (phones block
  // third-party cookies from *.onrender.com when the app is on *.vercel.app).
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
