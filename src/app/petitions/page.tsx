"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Calendar,
  ChevronRight,
  Users,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  TrendingUp,
  Target
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PetitionRecord } from "@/lib/content-types";

const statesList = ["All States", "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "West Bengal"];
const categoriesList = ["All Categories", "policy_change", "justice", "environment", "education", "health", "safety", "infrastructure", "corruption", "rights"];
const statusList = ["All Statuses", "open", "in_progress", "successful", "pending_review"];

export default function PetitionsPage() {
  const [petitions, setPetitions] = useState<PetitionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [sortBy, setSortBy] = useState<"newest" | "signatures">("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/petitions", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Petition list unavailable");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data?.petitions)) throw new Error("Invalid petition list");
        if (!controller.signal.aborted) setPetitions(data.petitions);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [loadAttempt]);

  const filteredPetitions = useMemo(() => {
    return petitions
      .filter((petition) => {
        const matchesSearch =
          petition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          petition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          petition.targetAuthority.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesState =
          selectedState === "All States" || petition.state === selectedState;
        
        const matchesCategory =
          selectedCategory === "All Categories" || petition.category.toLowerCase() === selectedCategory.toLowerCase();
        
        const matchesStatus =
          selectedStatus === "All Statuses" || petition.status === selectedStatus;

        return matchesSearch && matchesState && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          return b.signature_count - a.signature_count;
        }
      });
  }, [petitions, searchQuery, selectedState, selectedCategory, selectedStatus, sortBy]);

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "successful":
        return { color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900", label: "Successful", icon: CheckCircle2 };
      case "in_progress":
        return { color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900", label: "In Progress", icon: Clock };
      case "pending_review":
        return { color: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800", label: "Under Review", icon: AlertCircle };
      default:
        return { color: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900", label: "Open for Signatures", icon: TrendingUp };
    }
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  return (
    <div className="relative min-h-screen bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-rose-100/30 blur-3xl dark:bg-rose-900/10" />
        <div className="absolute bottom-10 left-10 h-80 w-80 rounded-full bg-amber-100/30 blur-3xl dark:bg-amber-900/10" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Petitions for Change
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Active petitions demanding action</h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Sign petitions to show your support for specific demands. When enough citizens stand together, authorities must listen.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search petitions..."
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

            <Button
              variant="outline"
              size="default"
              onClick={() => setSortBy(sortBy === "newest" ? "signatures" : "newest")}
              className="rounded-full h-11 px-4 gap-2 border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/90"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortBy === "newest" ? "Newest" : "Most Signed"}
            </Button>
          </div>
        </div>

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
                    {categoriesList.map(cat => <option key={cat} value={cat}>{cat === "All Categories" ? cat : cat.replace("_", " ").toUpperCase()}</option>)}
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

        {isLoading ? (
          <div role="status" className="py-16 text-center text-slate-600 dark:text-slate-300">Loading petitions...</div>
        ) : loadError ? (
          <div role="alert" className="rounded-3xl border border-slate-900/10 bg-white/90 px-6 py-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <p className="text-lg font-semibold">Petitions could not load right now.</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Please try again in a moment.</p>
            <Button variant="outline" className="mt-5 h-11 rounded-full" onClick={() => { setIsLoading(true); setLoadError(false); setLoadAttempt((attempt) => attempt + 1); }}>
              Try again
            </Button>
          </div>
        ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredPetitions.length > 0 ? (
            filteredPetitions.map((petition) => {
              const statusInfo = getStatusDetails(petition.status);
              const StatusIcon = statusInfo.icon;
              const progress = getProgressPercentage(petition.signature_count, petition.signature_goal);
              
              return (
                <motion.div
                  key={petition.$id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-900/10 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900/70"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-amber-950/40">
                    {petition.evidence.length > 0 ? (
                      <img
                        src={petition.evidence[0].publicUrl}
                        alt={petition.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Target className="h-16 w-16 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    <Badge className={`absolute left-4 top-4 border flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm uppercase ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <div className="flex flex-1 flex-col p-6 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        {petition.category.replace("_", " ").toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(petition.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold leading-tight text-slate-900 group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white line-clamp-2">
                      {petition.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                      {petition.demand}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {petition.signature_count.toLocaleString()} / {petition.signature_goal.toLocaleString()} signatures
                        </span>
                        <span className="text-slate-500">{progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-900/5 dark:border-white/5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <MapPin className="h-4 w-4 text-rose-500/80" />
                        {petition.state}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200">
                          <Users className="h-3 w-3" />
                        </span>
                        <strong>{petition.signature_count}</strong> signed
                      </div>
                    </div>

                    <Link href={`/petitions/${petition.slug}`} className="block">
                      <Button className="w-full rounded-2xl h-10 bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 flex items-center justify-center gap-1">
                        Sign petition
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center">
              <div className="text-lg font-medium text-slate-500">No petitions found matching your filters.</div>
              <p className="text-sm text-slate-400 mt-2">Try clearing your filters or search query.</p>
            </div>
          )}
        </motion.div>
        )}

        <div className="rounded-3xl border border-slate-900/10 bg-white/70 p-8 shadow-xl dark:border-white/10 dark:bg-slate-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-2xl font-semibold">Have a demand for change?</h3>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Start a petition, gather signatures, and deliver your demand to the authorities who can make it happen.
            </p>
          </div>
          <Link href="/petition/new">
            <Button size="lg" className="rounded-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 whitespace-nowrap shadow-md">
              Start a petition
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
