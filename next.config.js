/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
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
    }

    return config;
  }
};

module.exports = nextConfig; 