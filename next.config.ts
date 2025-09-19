import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Simplified config for Vercel
  webpack: (config, { isServer }) => {
    // Only run this for server-side bundling
    if (isServer) {
      // Mark these packages as external for server bundle
      config.externals = config.externals || [];
      config.externals.push('pdf-parse');
    }

    return config;
  },
};

export default nextConfig;
