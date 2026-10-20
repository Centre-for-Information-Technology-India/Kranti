import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import {
  appwriteDatabaseId,
  appwritePetitionsCollectionId,
  listDocuments,
  Query,
} from "@/lib/appwrite";
import { canonical, SITE_URL, buildBreadcrumbSchema } from "@/lib/seo";
import { isPublicPetitionStatus } from "@/lib/public-petition-status";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

async function fetchPetitionBySlug(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const res = (await listDocuments(appwriteDatabaseId, appwritePetitionsCollectionId, [
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
  const doc = await fetchPetitionBySlug(slug);

  if (!doc || !isPublicPetitionStatus(doc.status)) {
    return { title: "Petition not found", robots: { index: false, follow: false } };
  }

  const title = String(doc.title ?? "Petition");
  const description = (String(doc.description ?? "")).slice(0, 160).trim() ||
    `Sign this citizen petition on Kranti — ${title}.`;
  const url = canonical(`/petitions/${slug}`);
  const targetAuthority = String(doc.target_authority ?? doc.targetAuthority ?? "");

  const seoTitle = targetAuthority ? `${title} — Petition to ${targetAuthority}` : `${title} — Sign Petition`;

  return {
    title: seoTitle,
    description,
    alternates: { canonical: `/petitions/${slug}` },
    keywords: [
      title,
      "online petition India",
      `petition to ${targetAuthority}`,
      "sign petition",
      "demand action India",
    ].filter(Boolean),
    openGraph: {
      type: "article",
      url,
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

export default async function PetitionDetailLayout({ params, children }: Props) {
  const { slug } = await params;
  const doc = await fetchPetitionBySlug(slug);

  // Only public petition statuses may enter structured page data.
  if (!doc || !isPublicPetitionStatus(doc.status)) return <>{children}</>;

  const title = String(doc.title ?? "Petition");
  const description = String(doc.description ?? "").slice(0, 300);
  const signatureCount = Number(doc.signature_count ?? doc.signatureCount ?? 0);
  const signatureGoal = Number(doc.signature_goal ?? doc.signatureGoal ?? 1000);
  const targetAuthority = String(doc.target_authority ?? doc.targetAuthority ?? "");
  const createdAt = String(doc.created_at ?? doc.$createdAt ?? "");

  // Petition is best modeled as both Article (for search) + an explicit
  // declaration with InteractionCounter for engagement signals.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: canonical(`/petitions/${slug}`),
    datePublished: createdAt,
    dateModified: createdAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical(`/petitions/${slug}`) },
    publisher: {
      "@type": "Organization",
      name: "Kranti",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/kranti.png` },
    },
    articleSection: "Petition",
    inLanguage: doc.language === "hi" ? "hi-IN" : "en-IN",
    about: targetAuthority
      ? { "@type": "Organization", name: targetAuthority }
      : undefined,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/AgreeAction",
      userInteractionCount: signatureCount,
      description: `${signatureCount} of ${signatureGoal} signatures`,
    },
  };

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Petitions", path: "/petitions" },
    { name: title.slice(0, 60), path: `/petitions/${slug}` },
  ]);

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumb} />
      {children}
    </>
  );
}
