/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true
  },
  transpilePackages: ["@wheatraja/shared"],
  async rewrites() {
    const apiOrigin = process.env.ADMIN_API_ORIGIN ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "http://32.236.116.8");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`
      }
    ];
  }
};

export default nextConfig;
