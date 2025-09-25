/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  env: {
    PORT: process.env.PORT || '5005'
  }
};
export default nextConfig;
