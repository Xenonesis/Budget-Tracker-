/** @type {import('next').NextConfig} */
const nextConfig = {
  // Adding optimization for CSS loading
  experimental: {
    optimizeCss: true,
  },
  
  // Improve image loading configuration
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['api.dicebear.com', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/7.x/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
};

module.exports = nextConfig; 