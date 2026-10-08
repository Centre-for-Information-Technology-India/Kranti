"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Calendar, MapPin, Filter, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignRecord } from "@/lib/content-types";
import { campaignCategories, indianStates } from "@/lib/campaign-form";

const statusColors = {
  pending_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  paused: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/campaigns", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Campaign list unavailable");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data?.campaigns)) throw new Error("Invalid campaign list");
        setCampaigns(data.campaigns);
        setLoadError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [loadAttempt]);

  const filteredCampaigns = useMemo(() => {
    let filtered = [...campaigns];

    if (categoryFilter !== "all") {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    if (stateFilter !== "all") {
      filtered = filtered.filter((c) => c.state === stateFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    return filtered;
  }, [campaigns, categoryFilter, stateFilter, statusFilter]);

  const resetFilters = () => {
    setCategoryFilter("all");
    setStateFilter("all");
    setStatusFilter("all");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="space-y-4">
          <Badge variant="outline" className="border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-white/5">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Campaigns
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Collective pressure for real action.
          </h1>
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            Campaigns help people rally around urgent cases and keep institutions accountable in public view.
          </p>
        </div>

        <Card className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-slate-950 dark:focus:border-white/40"
              >
                <option value="all">All Categories</option>
                {campaignCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-slate-950 dark:focus:border-white/40"
              >
                <option value="all">All States</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-slate-950 dark:focus:border-white/40"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>

              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {loadError ? (
          <div role="alert" className="rounded-3xl border border-slate-900/10 bg-white/90 px-6 py-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <p className="text-lg font-semibold">Campaigns could not load right now.</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Please try again in a moment.</p>
            <Button variant="outline" className="mt-5 h-11 rounded-full" onClick={() => { setIsLoading(true); setLoadError(false); setLoadAttempt((attempt) => attempt + 1); }}>
              Try again
            </Button>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
            <CardContent className="py-12 text-center">
              <p className="text-slate-600 dark:text-slate-300">
                No campaigns found. {campaigns.length > 0 ? "Try adjusting your filters." : "Be the first to create one!"}
              </p>
              <Link href="/campaign/new">
                <Button className="mt-4">Create Campaign</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.$id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/campaigns/${campaign.slug}`}>
                  <Card className="h-full border-slate-900/10 bg-white/85 transition-all hover:shadow-lg dark:border-white/10 dark:bg-white/5">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <Badge className={statusColors[campaign.status]}>
                          {campaign.status.replace("_", " ")}
                        </Badge>
                        {campaign.featured && (
                          <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl line-clamp-2">{campaign.title}</CardTitle>
                      <CardDescription className="line-clamp-3">{campaign.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <MapPin className="h-4 w-4" />
                        <span>{campaign.state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Users className="h-4 w-4" />
                        <span>{campaign.volunteer_count} volunteers</span>
                      </div>
                      {campaign.start_date && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Calendar className="h-4 w-4" />
                          <span>Started {new Date(campaign.start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="pt-2">
                        <Badge variant="secondary">{campaignCategories.find((c) => c.value === campaign.category)?.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="text-2xl">How a campaign grows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
                A case starts with one report, gathers support from people who care, and turns into a public record that stays visible until something changes.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="text-2xl">What campaigns should do</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
                They should connect people around a shared problem, keep attention on the facts, and help push for lawful action instead of noise.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
