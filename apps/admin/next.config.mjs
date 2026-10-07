/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true
  },
  transpilePackages: ["@wheatraja/shared"],
  async rewrites() {
    const apiOrigin = process.env.ADMIN_API_ORIGIN ?? "https://wheatraja-api.onrender.com";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`
      }
    ];
  }
};

export default nextConfig;
