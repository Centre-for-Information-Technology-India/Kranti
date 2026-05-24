import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteGuides } from "@/lib/site-content";
import { SITE_URL } from "@/lib/seo";

function getGuideBySlug(slug: string) {
  return siteGuides.find((g) => g.slug === slug);
}

export async function generateStaticParams() {
  return siteGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  return {
    title: `${guide.title} | Kranti`,
    description: guide.summary,
    keywords: [
      guide.category,
      guide.title.split(" ").slice(0, 5).join(" "),
      "India",
      "citizen guide",
      "2025",
    ],
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.summary,
      url: `${SITE_URL}/guides/${guide.slug}`,
      type: "article",
      publishedTime: "2025-01-01T00:00:00Z",
      modifiedTime: new Date().toISOString(),
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title,
    description: guide.summary,
    url: `${SITE_URL}/guides/${guide.slug}`,
    ...(guide.schema?.totalTime && { totalTime: guide.schema.totalTime }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
      { "@type": "ListItem", position: 3, name: guide.title, item: `${SITE_URL}/guides/${guide.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="relative min-h-screen bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/3 top-0 h-96 w-96 rounded-full bg-amber-100/25 blur-3xl dark:bg-amber-900/10" />
        </div>

        <article className="relative mx-auto max-w-3xl space-y-8">
          {/* Back link */}
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Guides
          </Link>

          {/* Header */}
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/20 text-xs font-semibold rounded-full px-2.5 py-0.5 uppercase">
                {guide.category}
              </Badge>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {guide.timeToRead}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {guide.title}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-8">
              {guide.summary}
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-base leading-8 text-slate-700 dark:text-slate-300 space-y-4">
            {guide.content.split("\n\n").map((para, idx) => {
              if (para.startsWith("###")) {
                return (
                  <h2
                    key={idx}
                    id={para.replace("###", "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                    className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-2 scroll-mt-20"
                  >
                    {para.replace("###", "").trim()}
                  </h2>
                );
              }
              if (para.startsWith("*") || para.startsWith("-")) {
                return (
                  <ul key={idx} className="list-disc pl-6 space-y-2 my-4">
                    {para.split("\n").map((li, lidx) => (
                      <li key={lidx}>{li.replace(/^[\*\-\s]+/, "").trim()}</li>
                    ))}
                  </ul>
                );
              }
              if (para.match(/^\d+\./)) {
                return (
                  <ol key={idx} className="list-decimal pl-6 space-y-2 my-4">
                    {para.split("\n").map((li, lidx) => (
                      <li key={lidx}>{li.replace(/^\d+[\.\s]+/, "").trim()}</li>
                    ))}
                  </ol>
                );
              }
              const mdLinkMatch = para.match(/\[([^\]]+)\]\(([^)]+)\)/);
              if (mdLinkMatch) {
                const parts = para.split(mdLinkMatch[0]);
                return (
                  <p key={idx}>
                    {parts[0]}
                    <a
                      href={mdLinkMatch[2]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-700 underline underline-offset-4 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 inline-flex items-center gap-0.5"
                    >
                      {mdLinkMatch[1]}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {parts[1]}
                  </p>
                );
              }
              return <p key={idx}>{para.trim()}</p>;
            })}
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-wrap gap-3 border-t border-slate-900/10 pt-8 dark:border-white/10">
            <a
              href={guide.id === "rti-guide" ? "https://rtionline.gov.in/" : "https://pgportal.gov.in/"}
              target="_blank"
              rel="noreferrer"
            >
              <Button className="rounded-full gap-1.5 h-10 px-4 bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                Open Official Portal
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </article>
      </div>
    </>
  );
}
