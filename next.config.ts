import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // ── non-www → www canonical redirect ─────────────────────────────────────
  // The app is hosted at www.kranti.org.in (confirmed working in GSC).
  // Redirect bare domain traffic to www so all signals consolidate on one URL.
  // This also fixes: GSC "Alternative page with proper canonical tag" issue.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "kranti.org.in" }],
        destination: "https://www.kranti.org.in/:path*",
        permanent: true, // 301 — passes link equity to canonical
      },
    ];
  },

  // ── Security & caching headers ─────────────────────────────────────────────
  async headers() {
    return [
      {
        // Allow public pages to be cached by CDN and browser
        source: "/((?!api|_next|sign-in|sign-up|dashboard|admin|issue/new|petition/new|campaign/new|report/new).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Auth and private pages: never cache
        source: "/(sign-in|sign-up|dashboard|admin)(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
