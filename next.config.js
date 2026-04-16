const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Compress responses
  compress: true,
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Optimize on-demand compilation in development
  // Keep pages in memory longer to reduce recompilation
  onDemandEntries: {
    // Keep pages in memory for 5 minutes (instead of 25 seconds)
    maxInactiveAge: 5 * 60 * 1000,
    // Keep more pages in buffer (10 instead of 2)
    pagesBufferLength: 10,
  },
  
  // Note: optimizeFonts and swcMinify are now default in Next.js 16
  // and no longer need to be explicitly set
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
    ],
  },
  
  // Turbopack configuration (empty config to silence warning)
  turbopack: {},

  // Ensure Prisma runs in Node context so process.env.DATABASE_URL is available (fixes localhost:5432 with Turbopack)
  serverExternalPackages: ['@prisma/client', 'prisma'],
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // CSP: allow iframe sources (YouTube + Google Docs Viewer + GCS)
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://docs.google.com https://storage.googleapis.com;"
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Webpack configuration to prevent server-only packages from being bundled on client
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        os: false,
        crypto: false,
      }
    }

    // Ensure server-only packages are not bundled on client
    config.externals = config.externals || []
    if (!isServer) {
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        'prisma': 'commonjs prisma',
      })
    }

    return config
  },
}

module.exports = withBundleAnalyzer(nextConfig)

