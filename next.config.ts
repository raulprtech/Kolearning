/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['firebase-admin'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Ignorar warnings de genkit/opentelemetry en el cliente
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            'path': false,
            'fs': false,
            'os': false,
            'net': false,
            'tls': false,
        };
    }
    
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve '@opentelemetry\/exporter-jaeger'/,
      /require\.extensions is not supported by webpack/,
    ];
    return config;
  },
}

module.exports = nextConfig
