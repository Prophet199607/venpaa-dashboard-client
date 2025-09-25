/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  experimental: { typedRoutes: true },
  reactStrictMode: true,
  env: {
    PORT: process.env.PORT || '5005'
  }
};
export default nextConfig;
