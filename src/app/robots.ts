import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          // Private / auth pages — never index
          "/api/",
          "/admin",
          "/dashboard",
          "/sign-in",    // blocks /sign-in AND /sign-in?redirect_url=...
          "/sign-up",
          // Create/form pages — no value indexing empty forms
          "/issue/new",
          "/petition/new",
          "/campaign/new",
          "/report/new",
          // Offline fallback
          "/offline",
        ],
      },
      // Block AI scrapers
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "Google-Extended", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "anthropic-ai", disallow: "/" },
      { userAgent: "Amazonbot", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
