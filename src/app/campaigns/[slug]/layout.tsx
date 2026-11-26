import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import {
  appwriteDatabaseId,
  appwriteCampaignsCollectionId,
  listDocuments,
  Query,
} from "@/lib/appwrite";
import { canonical, SITE_URL, buildBreadcrumbSchema } from "@/lib/seo";
import { isIndexableCampaignStatus, isPublicCampaignStatus } from "@/lib/campaign-visibility";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

async function fetchCampaignBySlug(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const res = (await listDocuments(appwriteDatabaseId, appwriteCampaignsCollectionId, [
      Query.equal("slug", [slug]),
      Query.limit(1),
    ])) as { documents?: Array<Record<string, unknown>> };
    return res.documents?.[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await fetchCampaignBySlug(slug);

  if (!doc || !isPublicCampaignStatus(doc.status)) {
    return { title: "Campaign not found", robots: { index: false, follow: false } };
  }

  const title = String(doc.title ?? "Campaign");
  const description = String(doc.description ?? "").slice(0, 160).trim() ||
    `Join this civic campaign on Kranti — ${title}.`;
  const category = String(doc.category ?? "civic");
  const state = String(doc.state ?? "");

  const seoTitle = state ? `${title} — ${state} Civic Campaign` : `${title} — Civic Campaign`;

  return {
    title: seoTitle,
    description,
    robots: { index: isIndexableCampaignStatus(doc.status), follow: true },
    alternates: { canonical: `/campaigns/${slug}` },
    keywords: [
      title,
      `${category} campaign India`,
      `${state} civic campaign`,
      "volunteer India",
      "join campaign",
      "social movement India",
    ].filter(Boolean),
    openGraph: {
      type: "article",
      url: canonical(`/campaigns/${slug}`),
      title: seoTitle,
      description,
      siteName: "Kranti",
      locale: "en_IN",
      publishedTime: String(doc.created_at ?? doc.$createdAt ?? ""),
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
    },
  };
}

export default async function CampaignDetailLayout({ params, children }: Props) {
  const { slug } = await params;
  const doc = await fetchCampaignBySlug(slug);

  if (!doc || !isPublicCampaignStatus(doc.status)) return <>{children}</>;

  const title = String(doc.title ?? "Campaign");
  const description = String(doc.description ?? "").slice(0, 300);
  const volunteerCount = Number(doc.volunteer_count ?? doc.volunteerCount ?? 0);
  const startDate = String(doc.start_date ?? doc.startDate ?? "");
  const endDate = String(doc.end_date ?? doc.endDate ?? "");

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    description,
    url: canonical(`/campaigns/${slug}`),
    eventStatus: doc.status === "active"
      ? "https://schema.org/EventScheduled"
      : doc.status === "completed"
        ? "https://schema.org/EventPostponed"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    location: {
      "@type": "Place",
      name: String(doc.state ?? "India"),
      address: {
        "@type": "PostalAddress",
        addressRegion: String(doc.state ?? ""),
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Kranti",
      url: SITE_URL,
    },
    inLanguage: doc.language === "hi" ? "hi-IN" : "en-IN",
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/JoinAction",
      userInteractionCount: volunteerCount,
    },
  };

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Campaigns", path: "/campaigns" },
    { name: title.slice(0, 60), path: `/campaigns/${slug}` },
  ]);

  return (
    <>
      <JsonLd data={eventSchema} />
      <JsonLd data={breadcrumb} />
      {children}
    </>
  );
}
