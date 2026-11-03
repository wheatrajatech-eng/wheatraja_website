/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true
  },
  transpilePackages: ["@wheatraja/shared"],
  async rewrites() {
    const apiOrigin = process.env.ADMIN_API_ORIGIN ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "https://wheatraja-api.onrender.com");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`
      }
    ];
  }
};

export default nextConfig;
