/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Maps config is available to client bundles (also loaded at runtime via /api/config/maps).
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '',
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
