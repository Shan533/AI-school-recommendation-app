import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force dynamic rendering for auth pages to avoid build-time Supabase client issues
  experimental: {
    ppr: false,
  },
  // Disable static generation for problematic pages
  trailingSlash: false,
  // Disable static generation for auth pages
  // output: 'standalone', // Disabled for Vercel compatibility
  
  // Configure for Vercel deployment
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { isServer, webpack }) => {
    // Suppress Supabase Edge Runtime warnings
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        process: false,
      };
    }
    
    // Handle Supabase Edge Runtime compatibility
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    
    // Ignore specific modules that cause Edge Runtime issues
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(utf-8-validate|bufferutil)$/,
        contextRegExp: /node_modules\/@supabase\/realtime-js/,
      })
    );
    
    return config;
  },
  async headers() {
    return [
      {
        // Apply CORS headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // Specific headers for auth callback
        source: '/auth/callback',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
