import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { siteGuides } from "@/lib/site-content";
import {
  appwriteDatabaseId,
  appwriteIssuesCollectionId,
  appwritePetitionsCollectionId,
  appwriteCampaignsCollectionId,
  listDocuments,
  Query,
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
    const documents: DocWithSlug[] = [];
    const pageSize = 100;
    // Bound each hourly sitemap refresh while including cases beyond the first page.
    for (let offset = 0; offset < 10000; offset += pageSize) {
      const res = (await listDocuments(appwriteDatabaseId, collectionId, [
        Query.orderAsc("$id"),
        Query.limit(pageSize),
        Query.offset(offset),
      ])) as { documents?: DocWithSlug[] };
      const page = res.documents ?? [];
      documents.push(...page);
      if (page.length < pageSize) break;
    }

    return documents
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
  // ── Static public pages ────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,            changeFrequency: "daily",   priority: 1.0  },
    { url: `${SITE_URL}/issues`,      changeFrequency: "hourly",  priority: 0.95 },
    { url: `${SITE_URL}/petitions`,   changeFrequency: "hourly",  priority: 0.95 },
    { url: `${SITE_URL}/campaigns`,   changeFrequency: "daily",   priority: 0.9  },
    { url: `${SITE_URL}/guides`,      changeFrequency: "weekly",  priority: 0.9  },
    { url: `${SITE_URL}/create`,      changeFrequency: "weekly",  priority: 0.8  },
    { url: `${SITE_URL}/transparency`,changeFrequency: "weekly",  priority: 0.7  },
    { url: `${SITE_URL}/about`,       changeFrequency: "monthly", priority: 0.6  },
    { url: `${SITE_URL}/guidelines`,  changeFrequency: "monthly", priority: 0.5  },
    { url: `${SITE_URL}/moderation`,  changeFrequency: "yearly",  priority: 0.4  },
    { url: `${SITE_URL}/terms`,       changeFrequency: "yearly",  priority: 0.3  },
    { url: `${SITE_URL}/privacy`,     changeFrequency: "yearly",  priority: 0.3  },
  ];

  // ── Individual guide pages (static, high-value content) ───────────────────
  const guideRoutes: MetadataRoute.Sitemap = siteGuides
    .filter((g) => g.slug)
    .map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      // Only the local complaint guide has a recorded release date.
      ...(guide.slug === "how-to-report-local-service-complaint-india"
        ? { lastModified: "2026-10-18" }
        : {}),
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
