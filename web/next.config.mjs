/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: "/backend/:path*",
          destination: "http://153.92.221.161:8001/api/:path*",
        },
      ];
    },
  };
  
  export default nextConfig;