/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
  reactStrictMode: true,
  env: {
    PORT: process.env.PORT || '5005'
  }
};
export default nextConfig;
