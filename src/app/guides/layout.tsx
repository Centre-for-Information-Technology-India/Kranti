import type { Metadata } from "next";
import { siteGuides } from "@/lib/site-content";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How to File RTI, FIR and Consumer Complaints in India",
  description:
    "Find guides to filing RTI applications, reporting an FIR, making consumer complaints, and using civic grievance routes in India.",
  keywords: [
    "RTI application India",
    "how to file FIR India",
    "consumer complaint India",
    "CPGRAMS grievance portal",
    "civic rights India",
    "citizen guide India",
    "RTI template",
    "consumer court India",
  ],
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    title: "How to File RTI, FIR and Consumer Complaints in India | Kranti",
    description:
      "Find guides to filing RTI applications, reporting an FIR, making consumer complaints, and using civic grievance routes in India.",
    url: `${SITE_URL}/guides`,
    type: "website",
  },
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Citizen Guides — Kranti",
    description: "Practical legal guides for Indian citizens on RTI, FIR, consumer rights, and civic escalation",
    url: `${SITE_URL}/guides`,
    numberOfItems: siteGuides.length,
    itemListElement: siteGuides.map((guide, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "HowTo",
        name: guide.title,
        description: guide.summary,
        url: `${SITE_URL}/guides/${guide.slug}`,
        ...(guide.schema?.totalTime && { totalTime: guide.schema.totalTime }),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      {children}
    </>
  );
}
