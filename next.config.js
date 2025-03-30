/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  productionBrowserSourceMaps: false,
  compress: true,
  webpack: (config, { isServer, dev }) => {
    // Explicitly set up path aliases to ensure @ paths are correctly resolved
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };
    
    // Increase chunk load timeout
    config.watchOptions = {
      ...config.watchOptions,
      aggregateTimeout: 300,
      poll: 1000
    };
    
    // Only apply these optimizations in production and for client-side code
    if (!isServer) {
      // Optimize chunk sizes - ensure we're not overriding Next.js defaults inappropriately
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for third-party libraries
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          }
        }
      };

      // Increase chunk loading timeout
      config.output.chunkLoadTimeout = 20000; // 20 seconds
      
      // Add bundle analyzer in production with ANALYZE flag
      if (process.env.ANALYZE === 'true' && !dev) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        );
      }
    }

    return config;
  },
  // Optimize runtime performance with experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  }
};

module.exports = nextConfig; 