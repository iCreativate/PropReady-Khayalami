/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Maps key is available to client bundles (also loaded at runtime via /api/config/maps).
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Enable subdomain routing for agents portal
  async rewrites() {
    return [
      {
        source: '/agents/:path*',
        destination: '/agents/:path*',
      },
    ];
  },
};

export default nextConfig;
