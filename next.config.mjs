/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ['*.trycloudflare.com'],
  async redirects() {
    return [
      { source: '/btest', destination: '/', permanent: false },
      { source: '/btest/views', destination: '/views', permanent: false },
    ];
  },
};

export default nextConfig;
