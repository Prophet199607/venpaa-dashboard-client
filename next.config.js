/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: []
  },
  env: {
    PORT: process.env.PORT || '5005'
  }
};
export default nextConfig;
