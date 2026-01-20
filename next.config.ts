/** @type {import('next').NextConfig} */
const nextConfig = {
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
