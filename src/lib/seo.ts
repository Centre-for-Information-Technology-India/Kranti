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

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** Shorter variant for social cards; defaults to description. */
  socialDescription?: string;
};

/**
 * Per-page social metadata for public pages. The root layout supplies
 * site-wide openGraph/twitter defaults, but those reuse the site title and
 * description — this helper gives each public page its own social title,
 * description, URL, and canonical so shared links render correctly.
 */
export function pageMetadata({ title, description, path, socialDescription }: PageMetadataInput) {
  const socialTitle = `${title} | ${SITE_NAME}`;
  const socialDesc = socialDescription ?? description;
  const url = canonical(path);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description: socialDesc,
      url,
      siteName: SITE_NAME,
      type: "website" as const,
      locale: "en_IN",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: socialTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: socialTitle,
      description: socialDesc,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
