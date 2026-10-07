"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  Calendar,
  ChevronRight,
  ThumbsUp,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowUpDown
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IssueRecord } from "@/lib/content-types";
import { IssuesMap } from "@/components/issues-map";

const statesList = ["All States", "Maharashtra", "Karnataka", "Delhi"];
const categoriesList = ["All Categories", "roads", "water", "safety", "sanitation", "health"];
const statusList = ["All Statuses", "open", "in_progress", "resolved", "pending_review"];

export default function IssuesPage() {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [sortBy, setSortBy] = useState<"newest" | "supporters">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/issues", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Issue list unavailable");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data?.issues)) throw new Error("Invalid issue list");
        setIssues(data.issues);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });

    return () => controller.abort();
  }, [loadAttempt]);

  // Filter & Sort logic
  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        const matchesSearch =
          issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.district.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesState =
          selectedState === "All States" || issue.state === selectedState;
        
        const matchesCategory =
          selectedCategory === "All Categories" || issue.category.toLowerCase() === selectedCategory.toLowerCase();
        
        const matchesStatus =
          selectedStatus === "All Statuses" || issue.status === selectedStatus;

        return matchesSearch && matchesState && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          return b.supporter_count - a.supporter_count;
        }
      });
  }, [issues, searchQuery, selectedState, selectedCategory, selectedStatus, sortBy]);

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "resolved":
        return { color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900", label: "Resolved", icon: CheckCircle2 };
      case "in_progress":
        return { color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900", label: "In Progress", icon: Clock };
      case "pending_review":
        return { color: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800", label: "Under Review", icon: HelpCircle };
      default:
        return { color: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900", label: "Approved / Open", icon: AlertCircle };
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-amber-100/30 blur-3xl dark:bg-amber-900/10" />
        <div className="absolute bottom-10 left-10 h-80 w-80 rounded-full bg-rose-100/30 blur-3xl dark:bg-rose-900/10" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="space-y-4">
          <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Civic Watch
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Public issues raised by citizens</h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Discover active cases, review documented evidence, support community petitions, and follow timelines as we coordinate lawful civic actions.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by title, details, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 rounded-full border-slate-900/10 bg-white/90 shadow-sm focus:border-slate-950/20 dark:border-white/10 dark:bg-slate-900/90"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-full h-11 px-4 gap-2 border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/90 ${showFilters ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>

            <div className="flex items-center rounded-full border border-slate-900/10 bg-white/90 p-1 dark:border-white/10 dark:bg-slate-900/90 shadow-sm">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-9 w-9 rounded-full"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("map")}
                className="h-9 w-9 rounded-full"
              >
                <MapIcon className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="default"
              onClick={() => setSortBy(sortBy === "newest" ? "supporters" : "newest")}
              className="rounded-full h-11 px-4 gap-2 border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/90"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortBy === "newest" ? "Newest" : "Most Supported"}
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid gap-4 rounded-3xl border border-slate-900/5 bg-white/50 p-6 dark:border-white/5 dark:bg-slate-900/30 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl border border-slate-900/10 bg-white text-slate-900 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {statesList.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl border border-slate-900/10 bg-white text-slate-900 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {categoriesList.map(cat => <option key={cat} value={cat}>{cat === "All Categories" ? cat : cat.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl border border-slate-900/10 bg-white text-slate-900 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {statusList.map(stat => <option key={stat} value={stat}>{stat === "All Statuses" ? stat : stat.replace("_", " ").toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Map or Grid Render */}
        {loadError ? (
          <div role="alert" className="rounded-3xl border border-slate-900/10 bg-white/90 px-6 py-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <p className="text-lg font-semibold">Issues could not load right now.</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Please try again in a moment.</p>
            <Button variant="outline" className="mt-5 h-11 rounded-full" onClick={() => { setLoadError(false); setLoadAttempt((attempt) => attempt + 1); }}>
              Try again
            </Button>
          </div>
        ) : (
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <IssuesMap issues={filteredIssues} />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => {
                  const statusInfo = getStatusDetails(issue.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <motion.div
                      key={issue.$id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-900/10 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/70"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {issue.evidence.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={issue.evidence[0].publicUrl}
                            alt={issue.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            No evidence thumbnail
                          </div>
                        )}
                        <Badge className={`absolute left-4 top-4 border flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm uppercase ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Content Card Body */}
                      <div className="flex flex-1 flex-col p-6 space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            {issue.category.toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-xl font-semibold leading-tight text-slate-900 group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white line-clamp-2">
                          {issue.title}
                        </h3>

                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
                          {issue.description}
                        </p>

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-900/5 dark:border-white/5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <MapPin className="h-4 w-4 text-rose-500/80" />
                            {issue.district}, {issue.state}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200">
                              <ThumbsUp className="h-3 w-3" />
                            </span>
                            <strong>{issue.supporter_count}</strong> backed
                          </div>
                        </div>

                        <Link href={`/issues/${issue.slug}`} className="block">
                          <Button className="w-full rounded-2xl h-10 bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 flex items-center justify-center gap-1">
                            Review case details
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center">
                  <div className="text-lg font-medium text-slate-500">No issues found matching your filters.</div>
                  <p className="text-sm text-slate-400 mt-2">Try clearing your filters or search query to explore other cases.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {/* Raise Issue Callout */}
        <div className="rounded-3xl border border-slate-900/10 bg-white/70 p-8 shadow-xl dark:border-white/10 dark:bg-slate-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-2xl font-semibold">Have a civic grievance in your area?</h3>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Raise a public issue, upload evidence, and organize citizens in your neighborhood to demand accountability.
            </p>
          </div>
          <Link href="/issue/new">
            <Button size="lg" className="rounded-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 whitespace-nowrap shadow-md">
              Raise new issue
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
