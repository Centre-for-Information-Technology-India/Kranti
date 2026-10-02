import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { siteGuides } from "@/lib/site-content";
import {
  appwriteDatabaseId,
  appwriteIssuesCollectionId,
  appwritePetitionsCollectionId,
  appwriteCampaignsCollectionId,
  listDocuments,
} from "@/lib/appwrite";

// Revalidate every hour — picks up new content without being fully dynamic
export const revalidate = 3600;

interface DocWithSlug {
  slug?: string;
  $id: string;
  $updatedAt?: string;
  status?: string;
}

// Statuses whose detail pages are public and indexable. The sitemap must stay
// in sync with the noindex rules in the [slug] generateMetadata functions:
// anything they mark index:false must not appear here. A whitelist (not a
// blacklist) keeps future non-public statuses out by default.
const PUBLIC_ISSUE_STATUSES = ["open", "in_progress", "escalated", "resolved"];
const PUBLIC_PETITION_STATUSES = ["open", "in_progress", "resolved", "successful"];
const PUBLIC_CAMPAIGN_STATUSES = ["active", "completed"];

async function fetchPublicSlugs(
  collectionId: string,
  publicStatuses: string[]
): Promise<Array<{ slug: string; lastModified: string }>> {
  try {
    const res = (await listDocuments(appwriteDatabaseId, collectionId, [
      "limit(500)",
    ])) as { documents?: DocWithSlug[] };

    return (res.documents || [])
      .filter((d) => d.slug && d.status && publicStatuses.includes(d.status))
      .map((d) => ({
        slug: d.slug as string,
        lastModified: d.$updatedAt || new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // ── Static public pages ────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,            lastModified: now, changeFrequency: "daily",   priority: 1.0  },
    { url: `${SITE_URL}/issues`,      lastModified: now, changeFrequency: "hourly",  priority: 0.95 },
    { url: `${SITE_URL}/petitions`,   lastModified: now, changeFrequency: "hourly",  priority: 0.95 },
    { url: `${SITE_URL}/campaigns`,   lastModified: now, changeFrequency: "daily",   priority: 0.9  },
    { url: `${SITE_URL}/guides`,      lastModified: now, changeFrequency: "weekly",  priority: 0.9  },
    // /create is intentionally noindexed (see src/app/create/layout.tsx) so it
    // must not be listed in the sitemap.
    { url: `${SITE_URL}/transparency`,lastModified: now, changeFrequency: "weekly",  priority: 0.7  },
    { url: `${SITE_URL}/about`,       lastModified: now, changeFrequency: "monthly", priority: 0.6  },
    { url: `${SITE_URL}/guidelines`,  lastModified: now, changeFrequency: "monthly", priority: 0.5  },
    { url: `${SITE_URL}/moderation`,  lastModified: now, changeFrequency: "yearly",  priority: 0.4  },
    { url: `${SITE_URL}/terms`,       lastModified: now, changeFrequency: "yearly",  priority: 0.3  },
    { url: `${SITE_URL}/privacy`,     lastModified: now, changeFrequency: "yearly",  priority: 0.3  },
  ];

  // ── Individual guide pages (static, high-value content) ───────────────────
  const guideRoutes: MetadataRoute.Sitemap = siteGuides
    .filter((g) => g.slug)
    .map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));

  // ── Dynamic user content (fetched from Appwrite) ──────────────────────────
  const [issues, petitions, campaigns] = await Promise.all([
    fetchPublicSlugs(appwriteIssuesCollectionId, PUBLIC_ISSUE_STATUSES),
    fetchPublicSlugs(appwritePetitionsCollectionId, PUBLIC_PETITION_STATUSES),
    fetchPublicSlugs(appwriteCampaignsCollectionId, PUBLIC_CAMPAIGN_STATUSES),
  ]);

  const issueRoutes: MetadataRoute.Sitemap = issues.map((d) => ({
    url: `${SITE_URL}/issues/${d.slug}`,
    lastModified: d.lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  const petitionRoutes: MetadataRoute.Sitemap = petitions.map((d) => ({
    url: `${SITE_URL}/petitions/${d.slug}`,
    lastModified: d.lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  const campaignRoutes: MetadataRoute.Sitemap = campaigns.map((d) => ({
    url: `${SITE_URL}/campaigns/${d.slug}`,
    lastModified: d.lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [
    ...staticRoutes,
    ...guideRoutes,
    ...issueRoutes,
    ...petitionRoutes,
    ...campaignRoutes,
  ];
}
