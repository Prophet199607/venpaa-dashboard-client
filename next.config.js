/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**'
      },
      {
        protocol: "https",
        hostname: "venpaaapi.onimtaitsl.com",
        pathname: "/storage/**",
      },
    ],
  },
  env: {
    PORT: 5005
  }
};
export default nextConfig;
