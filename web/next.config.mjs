/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export build compatibility
  },
  allowedDevOrigins: ['192.168.20.11', '100.80.196.99'],
};

export default nextConfig;
