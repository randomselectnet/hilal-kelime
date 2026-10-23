import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const shared: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const nextConfig: NextConfig = isStaticExport
  ? {
      ...shared,
      output: "export",
      trailingSlash: true,
      basePath: basePath || undefined,
      images: { unoptimized: true },
    }
  : {
      ...shared,
      cacheComponents: true,
      partialPrefetching: true,
    };

export default nextConfig;
