/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: false,
  swcMinify: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /ort\.node\.min\.mjs$/,
      })
    );

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'sharp$': false,
        'onnxruntime-node$': false,
      };
    }

    return config;
  },
  async redirects() {
    return [
      {
        source: '/oferta',
        destination: '/az/pages/terms-of-service',
        permanent: true,
      },
      {
        source: '/qaytarilma',
        destination: '/az/pages/return-policy',
        permanent: true,
      },
      {
        source: '/mexfilik',
        destination: '/az/pages/privacy-policy',
        permanent: true,
      },
      {
        source: '/terms',
        destination: '/az/pages/terms-of-service',
        permanent: true,
      },
      {
        source: '/return-policy',
        destination: '/az/pages/return-policy',
        permanent: true,
      },
      {
        source: '/privacy-policy',
        destination: '/az/pages/privacy-policy',
        permanent: true,
      },
      {
        source: '/returns',
        destination: '/az/pages/return-policy',
        permanent: true,
      },
      {
        source: '/privacy',
        destination: '/az/pages/privacy-policy',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
