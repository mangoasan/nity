import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3101/api");
const apiOrigin = apiUrl.origin;

const internalApiOrigin = (() => {
  try {
    const internalUrl = process.env.INTERNAL_API_URL;
    if (internalUrl) return new URL(internalUrl).origin;
  } catch {}
  return apiOrigin;
})();

const imageHosts = new Map<
  string,
  { protocol: "http" | "https"; hostname: string; port: string }
>();

function addImageHost(hostname: string, port: string) {
  imageHosts.set(`${apiUrl.protocol}//${hostname}:${port}`, {
    protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
    hostname,
    port,
  });
}

addImageHost(apiUrl.hostname, apiUrl.port);

if (apiUrl.hostname === "localhost") {
  addImageHost("127.0.0.1", apiUrl.port);
}

if (apiUrl.hostname === "127.0.0.1") {
  addImageHost("localhost", apiUrl.port);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...imageHosts.values(),
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${internalApiOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
