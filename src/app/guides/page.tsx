"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteGuides } from "@/lib/site-content";

export default function GuidesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGuides = siteGuides.filter(
    (guide) =>
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/3 top-0 h-96 w-96 rounded-full bg-amber-100/25 blur-3xl dark:bg-amber-900/10" />
      </div>

      <div className="relative mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div className="space-y-4 text-center">
          <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Citizen Education Library
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Grievance & Escalation Guides</h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Practical legal blueprints and draft templates empowering Indian citizens to pursue accountability from public and private institutions.
          </p>
        </div>

        {/* Search */}
        <div className="relative mx-auto max-w-md">
          <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-12 pr-4 rounded-full border border-slate-900/10 bg-white/90 shadow-sm focus:border-slate-950/20 focus:outline-none dark:border-white/10 dark:bg-slate-900/90 dark:text-white"
          />
        </div>

        {/* Guide Cards */}
        <div className="space-y-4">
          {filteredGuides.length > 0 ? (
            filteredGuides.map((guide) => (
              <Link key={guide.id} href={`/guides/${guide.slug}`}>
                <Card className="border-slate-900/10 bg-white/90 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-900/20 dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-white/20 mb-4">
                  <CardHeader className="p-6 md:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/20 text-xs font-semibold rounded-full px-2.5 py-0.5 uppercase">
                            {guide.category}
                          </Badge>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {guide.timeToRead}
                          </span>
                        </div>
                        <CardTitle className="text-xl font-semibold leading-tight text-slate-900 dark:text-white">
                          {guide.title}
                        </CardTitle>
                        <CardDescription className="text-base text-slate-600 dark:text-slate-350">
                          {guide.summary}
                        </CardDescription>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-400" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500">
              No guides match your search. Try &quot;RTI&quot; or &quot;Consumer&quot;.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="rounded-3xl border border-dashed border-slate-900/20 bg-white/50 p-6 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/30 dark:text-slate-400 leading-relaxed">
          💡 <strong>Need evidence collection advice?</strong> Download our verified field-photo guidelines for local issues to ensure submissions protect witness faces and avoid defamation liabilities.
        </div>
      </div>
    </div>
  );
}
