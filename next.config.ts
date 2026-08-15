import type { NextConfig } from "next";

const APEX_HOST = "moe-chislo.online";
const WWW_HOST = "www.moe-chislo.online";

const nextConfig: NextConfig = {
  // Генератор PDF читает эти шрифты с диска во время запроса. Их никто не
  // импортирует, поэтому трассировка файлов не увидит зависимость и роуты
  // уедут в деплой без шрифтов — вся кириллица превратится в мусор.
  outputFileTracingIncludes: {
    "/api/webhook": ["./public/fonts/**"],
    "/api/generate-pdf": ["./public/fonts/**"],
  },

  poweredByHeader: false,

  async redirects() {
    return [
      // Canonical host: everything served on the apex is redirected to www,
      // which is the host used in SITE_URL, canonical tags and sitemap.xml.
      {
        source: "/:path*",
        has: [{ type: "host", value: APEX_HOST }],
        destination: `https://${WWW_HOST}/:path*`,
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
