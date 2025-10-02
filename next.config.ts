import type {NextConfig} from 'next';

console.log('🔧 Next.js config loading...');
console.log('📦 NODE_ENV:', process.env.NODE_ENV);
console.log('🏗️ Build environment detected');

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
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
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
    console.log('🔨 Webpack config processing...');
    console.log('🖥️ Is server build:', isServer);

    // Only run this for server-side bundling
    if (isServer) {
      console.log('📦 Server build detected, configuring externals...');
      // Mark these packages as external for server bundle
      config.externals = config.externals || [];
      config.externals.push('pdf-parse');
      
      // Also externalize Supabase realtime to avoid Edge Runtime issues
      config.externals.push({
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js',
      });
      
      console.log('✅ pdf-parse and Supabase dependencies added to externals');
    }

    console.log('🔧 Webpack config completed');
    return config;
  },
};

console.log('✅ Next.js configuration loaded successfully');
console.log('📋 Config summary:', {
  typescript: nextConfig.typescript,
  eslint: nextConfig.eslint,
  experimental: nextConfig.experimental,
  images: nextConfig.images,
  hasWebpackConfig: !!nextConfig.webpack
});

export default nextConfig;
