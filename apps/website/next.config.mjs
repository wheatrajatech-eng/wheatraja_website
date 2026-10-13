/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "videos.pexels.com" }
    ]
  },
  async rewrites() {
    const backendOrigin = process.env.API_SERVER_URL ?? (process.env.VERCEL ? "https://wheatraja-api.onrender.com" : "http://localhost:8001");
    return [{
      source: "/api/v1/:path*",
      destination: `${backendOrigin}/api/v1/:path*`
    }];
  }
};

export default nextConfig;
