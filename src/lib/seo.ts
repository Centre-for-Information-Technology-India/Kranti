// ─────────────────────────────────────────────────────────────────────────────
// Kranti — Centralised SEO configuration
// Single source of truth for site URL, organisation schema, and meta defaults
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.kranti.org.in";

export const SITE_NAME = "Kranti";

export const SITE_TAGLINE = "People First Civic Action";

export const SITE_DESCRIPTION =
  "Evidence-based civic voice platform for lawful change in India. Raise civic issues, file petitions, organise peaceful campaigns, and document incidents with verifiable evidence.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "Kranti — People First Civic Action",
  url: SITE_URL,
  logo: `${SITE_URL}/kranti.png`,
  description: SITE_DESCRIPTION,
  foundingDate: "2025",
  foundingLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
      addressRegion: "Delhi",
    },
  },
  sameAs: [
    "https://www.cit.org.in",
    // Add real social profiles when live:
    // "https://twitter.com/krantiorgin",
    // "https://github.com/citindia/kranti",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "Grievance Officer",
      email: "grievance@kranti.org.in",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    {
      "@type": "ContactPoint",
      contactType: "Privacy / Data Protection",
      email: "privacy@kranti.org.in",
      areaServed: "IN",
    },
  ],
  parentOrganization: {
    "@type": "Organization",
    name: "Centre for Information Technology India",
    url: "https://www.cit.org.in",
  },
};

export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: ["en-IN", "hi-IN"],
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/kranti.png` },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/issues?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// Helper to build a BreadcrumbList schema
export function buildBreadcrumbSchema(
  trail: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

// Helper to build canonical URL
export function canonical(path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}
