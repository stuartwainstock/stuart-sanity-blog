import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * react-map-gl wrappers only — do not transpile `maplibre-gl` itself; its dist embeds a
   * worker bundle string that re-transpilation can break (blank basemap, markers still OK).
   * Use `src/lib/maplibreClient.ts` + `@babel/runtime` polyfill for `_wrap_native_super`.
   */
  transpilePackages: ['react-map-gl', '@vis.gl/react-maplibre'],
  experimental: {
    optimizePackageImports: ['@portabletext/react', '@mapbox/polyline'],
  },
  compiler: {
    // Target modern browsers to reduce transpilation and polyfills
    // This reduces bundle size and improves performance
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  async redirects() {
    return [
      {
        source: '/travel/flights-demo',
        destination: '/flights',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
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
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
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
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              process.env.NODE_ENV === 'development'
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.sanity.io https://vercel.live https://www.googletagmanager.com"
                : "script-src 'self' 'unsafe-inline' https://cdn.sanity.io https://vercel.live https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://cdn.sanity.io https://www.google-analytics.com https://*.basemaps.cartocdn.com",
              "connect-src 'self' https://*.sanity.io https://*.sanity.run https://vercel.live https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://api.ebird.org https://*.basemaps.cartocdn.com",
              "worker-src 'self' blob:",
              "frame-src 'self' https://*.sanity.io https://www.youtube-nocookie.com https://www.youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
