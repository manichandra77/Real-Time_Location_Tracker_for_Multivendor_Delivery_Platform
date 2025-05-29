/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
  // Completely disable webpack caching
  cache: false,
  // Additional cache control to prevent cache-related issues
  generateBuildId: () => 'build-' + Date.now(),
};

module.exports = nextConfig;