/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "venpaaapi.onimtaitsl.com",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "venpaa-v2.s3.ap-southeast-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  env: {
    PORT: 5005,
  },
};
export default nextConfig;
