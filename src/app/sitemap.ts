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

// Force dynamic so the sitemap picks up new content on every crawl
export const dynamic = "force-dynamic";
export const revalidate = 3600; // also cache for 1 hour as a fallback

interface DocWithSlug {
  slug?: string;
  $id: string;
  $updatedAt?: string;
  status?: string;
}

async function fetchPublicSlugs(
  collectionId: string
): Promise<Array<{ slug: string; lastModified: string }>> {
  try {
    const res = (await listDocuments(appwriteDatabaseId, collectionId, [
      'limit(500)',
    ])) as { documents?: DocWithSlug[] };
    const docs = res.documents || [];
    return docs
      .filter((d) => d.slug && d.status !== "pending_review")
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

  // Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/issues`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${SITE_URL}/petitions`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${SITE_URL}/campaigns`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/create`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/transparency`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/guidelines`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/moderation`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/donate`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/volunteer`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Dynamic content — fetch in parallel
  const [issues, petitions, campaigns] = await Promise.all([
    fetchPublicSlugs(appwriteIssuesCollectionId),
    fetchPublicSlugs(appwritePetitionsCollectionId),
    fetchPublicSlugs(appwriteCampaignsCollectionId),
  ]);

  const issueRoutes: MetadataRoute.Sitemap = issues.map((d) => ({
    url: `${SITE_URL}/issues/${d.slug}`,
    lastModified: d.lastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const petitionRoutes: MetadataRoute.Sitemap = petitions.map((d) => ({
    url: `${SITE_URL}/petitions/${d.slug}`,
    lastModified: d.lastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const campaignRoutes: MetadataRoute.Sitemap = campaigns.map((d) => ({
    url: `${SITE_URL}/campaigns/${d.slug}`,
    lastModified: d.lastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const guideRoutes: MetadataRoute.Sitemap = siteGuides.map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  return [...staticRoutes, ...guideRoutes, ...issueRoutes, ...petitionRoutes, ...campaignRoutes];
}
