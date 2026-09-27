import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@marco-polo/experience-edvisor"],
  // Static export for lasting partner hosting (Netlify/Firebase Hosting).
  // Server APIs remain in app/api when deploying to Vercel/Node; export build
  // moves them aside via scripts/publish-static.mjs
  ...(process.env.MPE_STATIC_EXPORT === "1"
    ? {
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {
        images: {
          remotePatterns: [
            {
              protocol: "https",
              hostname: "images.unsplash.com",
            },
          ],
        },
      }),
};

export default nextConfig;
