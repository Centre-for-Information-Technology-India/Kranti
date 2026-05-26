"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  HelpCircle,
  Search,
  Check,
  X,
  AlertTriangle,
  FileText,
  User,
  MapPin,
  Sparkles,
  Inbox,
  Filter,
  Eye,
  AlertOctagon,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IssueRecord } from "@/lib/content-types";

interface AdminLog {
  id: string;
  issueId: string;
  issueTitle: string;
  action: "APPROVE" | "REJECT" | "ESCALATE" | "RESOLVE";
  reason: string;
  timestamp: string;
  moderatorName: string;
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "escalated" | "in_progress" | "resolved">("open");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [moderationLogs, setModerationLogs] = useState<AdminLog[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  // Client-side role guard
  useEffect(() => {
    fetch("/api/auth/role")
      .then((res) => res.json())
      .then((data) => {
        if (data.role !== "admin" && data.role !== "moderator") {
          setAccessDenied(true);
        }
        setRoleChecked(true);
      })
      .catch(() => {
        setAccessDenied(true);
        setRoleChecked(true);
      });
  }, []);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((i) => i.status === "open").length;
    const escalated = issues.filter((i) => i.status === "escalated" || i.status === "in_progress").length;
    const resolved = issues.filter((i) => i.status === "resolved").length;
    const rejected = issues.filter((i) => i.status === "rejected").length;
    
    return { total, open, escalated, resolved, rejected };
  }, [issues]);

  // Filtered issues list
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" || issue.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [issues, searchQuery, statusFilter]);

  // Select the current issue object
  const selectedIssue = useMemo(() => {
    return issues.find((i) => i.$id === selectedIssueId) || null;
  }, [issues, selectedIssueId]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/issues", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        const nextIssues = Array.isArray(data?.issues) ? data.issues : [];
        setIssues(nextIssues);
        setSelectedIssueId((current) => current || nextIssues.find((issue: IssueRecord) => issue.status === "open")?.$id || nextIssues[0]?.$id || null);
      })
      .catch(() => {
        setIssues([]);
        setSelectedIssueId(null);
      });

    return () => controller.abort();
  }, []);

  async function callModerate(issueId: string, action: string, reason: string) {
    setActionLoading(action);
    try {
      const res = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, action, reason }),
      });
      if (res.status === 403) {
        setAccessDenied(true);
        return null;
      }
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } finally {
      setActionLoading(null);
    }
  }

  const handleApprove = async (issueId: string) => {
    const issueToUpdate = issues.find(i => i.$id === issueId);
    if (!issueToUpdate) return;
    const result = await callModerate(issueId, "approve", "Meets verification criteria. Clear geo-evidence and neutral narrative tone.");
    if (!result) return;
    setIssues(prev => prev.map(issue => issue.$id === issueId ? { ...issue, status: "open" } : issue));
    setModerationLogs(prev => [{
      id: `log_${Date.now()}`, issueId, issueTitle: issueToUpdate.title,
      action: "APPROVE", reason: "Meets verification criteria.",
      timestamp: new Date().toISOString(), moderatorName: user?.fullName || "Moderator"
    }, ...prev]);
  };

  const handleRejectSubmit = async () => {
    if (!selectedIssueId) return;
    const issueToUpdate = issues.find(i => i.$id === selectedIssueId);
    if (!issueToUpdate) return;
    const reason = rejectReason || "Content violates platform guidelines (Spam/Doxxing).";
    const result = await callModerate(selectedIssueId, "reject", reason);
    if (!result) return;
    setIssues(prev => prev.filter(issue => issue.$id !== selectedIssueId));
    setModerationLogs(prev => [{
      id: `log_${Date.now()}`, issueId: selectedIssueId, issueTitle: issueToUpdate.title,
      action: "REJECT", reason,
      timestamp: new Date().toISOString(), moderatorName: user?.fullName || "Moderator"
    }, ...prev]);
    setShowRejectDialog(false);
    setRejectReason("");
    const nextFirst = issues.find(i => i.$id !== selectedIssueId);
    setSelectedIssueId(nextFirst?.$id || null);
  };

  const handleEscalate = async (issueId: string) => {
    const issueToUpdate = issues.find(i => i.$id === issueId);
    if (!issueToUpdate) return;
    const result = await callModerate(issueId, "escalate", "Escalated to local authorities. Direct RTI request formulated.");
    if (!result) return;
    setIssues(prev => prev.map(issue => issue.$id === issueId ? { ...issue, status: "escalated" } : issue));
    setModerationLogs(prev => [{
      id: `log_${Date.now()}`, issueId, issueTitle: issueToUpdate.title,
      action: "ESCALATE", reason: "Escalated to local authorities.",
      timestamp: new Date().toISOString(), moderatorName: user?.fullName || "Moderator"
    }, ...prev]);
  };

  const handleResolve = async (issueId: string) => {
    const issueToUpdate = issues.find(i => i.$id === issueId);
    if (!issueToUpdate) return;
    const result = await callModerate(issueId, "resolve", "Citizen and moderator verified civic resolution details.");
    if (!result) return;
    setIssues(prev => prev.map(issue => issue.$id === issueId ? { ...issue, status: "resolved" } : issue));
    setModerationLogs(prev => [{
      id: `log_${Date.now()}`, issueId, issueTitle: issueToUpdate.title,
      action: "RESOLVE", reason: "Verified civic resolution.",
      timestamp: new Date().toISOString(), moderatorName: user?.fullName || "Moderator"
    }, ...prev]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-350 uppercase text-[10px]">Resolved</Badge>;
      case "escalated":
      case "in_progress":
        return <Badge className="bg-amber-50 border-amber-250 text-amber-700 hover:bg-amber-50 dark:bg-amber-950/40 dark:text-amber-350 uppercase text-[10px]">Escalated</Badge>;
      case "rejected":
        return <Badge className="bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-350 uppercase text-[10px]">Rejected</Badge>;
      default:
        return <Badge className="bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-50 dark:bg-rose-950/40 dark:text-rose-350 uppercase text-[10px]">Open</Badge>;
    }
  };

  if (!isLoaded || !roleChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent dark:border-white"></div>
          <p className="text-sm text-slate-500">Loading moderation center...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <ShieldAlert className="h-12 w-12 text-rose-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-sm text-slate-500">
            Your account does not have moderator or admin privileges. Contact the platform administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-amber-100/20 blur-3xl dark:bg-amber-900/10" />
        <div className="absolute bottom-10 left-10 h-80 w-80 rounded-full bg-rose-100/20 blur-3xl dark:bg-rose-900/10" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8">
        {/* Header Block */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                Administration Panel
              </Badge>
              <Badge className="bg-emerald-500 text-slate-950 font-semibold border-none rounded-full px-2.5 py-0.5 text-[10px]">
                Live DB Mode
              </Badge>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">Moderation Queue</h1>
            <p className="max-w-2xl text-slate-600 dark:text-slate-350">
              Audit public issues, verify photographic and video evidence coordinates, filter spam/doxxing violations, and escalate verified reports.
            </p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Active/Open", count: stats.open, color: "text-rose-600 dark:text-rose-400", icon: AlertOctagon },
            { label: "Escalated", count: stats.escalated, color: "text-amber-600 dark:text-amber-400", icon: Clock },
            { label: "Resolved", count: stats.resolved, color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
            { label: "Rejected", count: stats.rejected, color: "text-slate-600 dark:text-slate-300", icon: HelpCircle },
            { label: "Total", count: stats.total, color: "text-slate-700 dark:text-slate-200", icon: Layers }
          ].map((item) => (
            <Card key={item.label} className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  {item.label}
                  <item.icon className="h-3.5 w-3.5" />
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-1 pb-4">
                <span className={`text-2xl font-bold ${item.color}`}>{item.count}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Interface Layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          {/* Left Column: Queue List */}
          <div className="flex flex-col gap-4 h-[750px] overflow-hidden rounded-3xl border border-slate-900/10 bg-white/95 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex flex-col gap-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search queue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-2xl border-slate-900/10 bg-white/90 focus:border-slate-950/20 dark:border-white/10 dark:bg-slate-950/80"
                />
              </div>

              {/* Status filtering tabs */}
              <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl">
                {[
                  { id: "open", label: "Open" },
                  { id: "escalated", label: "Escalated" },
                  { id: "resolved", label: "Resolved" },
                  { id: "all", label: "All" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`flex-1 text-[11px] font-semibold py-1.5 px-2.5 rounded-xl transition-all ${
                      statusFilter === tab.id
                        ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              <AnimatePresence>
                {filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                    <motion.div
                      key={issue.$id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedIssueId(issue.$id)}
                      className={`group flex flex-col p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedIssueId === issue.$id
                          ? "bg-slate-100 border-slate-900/10 dark:bg-slate-850 dark:border-white/20"
                          : "bg-transparent border-slate-900/5 hover:bg-slate-50/50 dark:border-white/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {issue.category}
                        </span>
                        <div className="flex gap-1.5 items-center">
                          {issue.evidence_count > 0 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 border-slate-900/10 dark:border-white/10">
                              {issue.evidence_count} Ev.
                            </Badge>
                          )}
                          {getStatusBadge(issue.status)}
                        </div>
                      </div>
                      <h4 className="mt-2 font-semibold text-sm leading-tight text-slate-900 group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white line-clamp-2">
                        {issue.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {issue.district}, {issue.state}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-900/5 dark:border-white/5 pt-2">
                        <span>By {issue.creatorName}</span>
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-3">
                    <Inbox className="h-10 w-10 text-slate-350 dark:text-slate-650" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">No issues match filters</p>
                      <p className="text-xs text-slate-400 mt-1">Check back later or choose another filter category.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Detail & Audit Control Workspace */}
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {selectedIssue ? (
                <motion.div
                  key={selectedIssue.$id}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col rounded-3xl border border-slate-900/10 bg-white/95 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/80"
                >
                  {/* Title & Creator Block */}
                  <div className="border-b border-slate-900/5 dark:border-white/5 pb-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <Badge className="bg-slate-950 text-white dark:bg-white dark:text-slate-950 rounded-full font-medium uppercase text-[10px]">
                          {selectedIssue.category}
                        </Badge>
                        {getStatusBadge(selectedIssue.status)}
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Raised: {new Date(selectedIssue.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {selectedIssue.title}
                    </h2>

                    <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedIssue.creatorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                          alt={selectedIssue.creatorName}
                          className="h-8 w-8 rounded-full object-cover border border-slate-900/10 dark:border-white/10"
                        />
                        <div>
                          <p className="text-xs font-semibold">{selectedIssue.creatorName}</p>
                          <p className="text-[10px] text-slate-400">Reporter ID: {selectedIssue.created_by}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Reporter Trust Score</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Live profile lookup pending
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="py-5 space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                        Civic Location Details
                      </h4>
                      <p className="text-sm font-semibold">
                        {selectedIssue.landmark ? `${selectedIssue.landmark}, ` : ""}{selectedIssue.district}, {selectedIssue.state}
                      </p>
                      {selectedIssue.location && (
                        <p className="text-[11px] font-mono text-slate-500">
                          Coordinates: [{selectedIssue.location[0].toFixed(4)}, {selectedIssue.location[1].toFixed(4)}] (Lng, Lat)
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Civic Narrative</h4>
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-350 whitespace-pre-line">
                        {selectedIssue.description}
                      </p>
                    </div>

                    {/* Evidence Gallery */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Documented Evidence</h4>
                      {selectedIssue.evidence.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedIssue.evidence.map((file) => (
                            <div
                              key={file.fileId}
                              className="group relative overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-50 dark:border-white/10 dark:bg-slate-950/40 p-2.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-all"
                            >
                              {file.mimeType.startsWith("image/") ? (
                                <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={file.publicUrl} alt={file.name} className="h-full w-full object-cover" />
                                </div>
                              ) : (
                                <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0 text-red-700">
                                  <FileText className="h-5 w-5" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold truncate text-slate-900 dark:text-white">{file.name}</p>
                                <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.mimeType.split("/")[1].toUpperCase()}</p>
                              </div>
                              <a
                                href={file.publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="opacity-0 group-hover:opacity-100 absolute right-2 bg-slate-950 text-white rounded-full p-1.5 transition-all dark:bg-white dark:text-slate-950 shadow-sm"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No evidence attachments uploaded.</p>
                      )}
                    </div>
                  </div>

                  {/* AI Assistance Pre-audit Analysis */}
                  <div className="bg-emerald-50/50 border border-emerald-900/10 rounded-2xl p-4 dark:bg-emerald-950/10 dark:border-emerald-900/20 mb-5">
                    <div className="flex gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Kranti AI Assistant Pre-audit</p>
                        <p className="text-xs text-emerald-700 leading-relaxed dark:text-emerald-300">
                          {selectedIssue.status === "pending_review" || selectedIssue.status === "open" 
                            ? "Content matches neutral, non-inciting civic standards. Location data matches postal registers. Suggested action: Approve / Publish."
                            : `Audit complete. Issue currently set to '${selectedIssue.status.toUpperCase()}'. Status timelines are synchronized with public directories.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="border-t border-slate-900/5 dark:border-white/5 pt-4 flex flex-wrap gap-2 justify-end">
                    {/* Only show reject/approve if it's pending review */}
                    {selectedIssue.status === "open" ? (
                      <>
                        <Button
                          onClick={() => setShowRejectDialog(true)}
                          disabled={!!actionLoading}
                          variant="outline"
                          className="rounded-xl h-10 border-rose-250 bg-rose-50/20 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:bg-rose-950/10 dark:text-rose-400 dark:border-rose-900"
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Reject (Violations)
                        </Button>
                        <Button
                          onClick={() => handleApprove(selectedIssue.$id)}
                          disabled={!!actionLoading}
                          className="rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center"
                        >
                          {actionLoading === "approve" ? (
                            <div className="h-4 w-4 mr-1.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Check className="h-4 w-4 mr-1.5" />
                          )}
                          Approve & Publish
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 w-full justify-between">
                        <p className="text-xs text-slate-400 italic">
                          This issue has been approved. Change workflow status below:
                        </p>
                        <div className="flex gap-2">
                          {selectedIssue.status !== "escalated" && selectedIssue.status !== "in_progress" && selectedIssue.status !== "resolved" && (
                            <Button
                              onClick={() => handleEscalate(selectedIssue.$id)}
                              disabled={!!actionLoading}
                              variant="outline"
                              className="rounded-xl h-10 border-slate-900/10 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900"
                            >
                              {actionLoading === "escalate" ? (
                                <div className="h-4 w-4 mr-1.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                              ) : (
                                <Clock className="h-4 w-4 mr-1.5 text-amber-500" />
                              )}
                              Mark Escalated
                            </Button>
                          )}
                          {selectedIssue.status !== "resolved" && (
                            <Button
                              onClick={() => handleResolve(selectedIssue.$id)}
                              disabled={!!actionLoading}
                              className="rounded-xl h-10 bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                            >
                              {actionLoading === "resolve" ? (
                                <div className="h-4 w-4 mr-1.5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-400" />
                              )}
                              Mark Resolved
                            </Button>
                          )}
                          <Link href={`/issues/${selectedIssue.slug}`} className="block">
                            <Button
                              variant="ghost"
                              className="rounded-xl h-10 border border-slate-900/10 dark:border-white/10"
                            >
                              View Public Page
                              <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center p-20 border border-dashed border-slate-900/10 rounded-3xl bg-white/50 text-slate-400 text-center">
                  <Inbox className="h-12 w-12 mb-3" />
                  <p className="text-sm font-semibold">No issue selected</p>
                  <p className="text-xs mt-1">Select an issue from the queue list to inspect it.</p>
                </div>
              )}
            </AnimatePresence>

            {/* Audit Logs Trail */}
            <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <CardHeader className="pb-3 border-b border-slate-900/5 dark:border-white/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-slate-500" />
                  Recent Moderation Audit Logs
                </CardTitle>
                <CardDescription className="text-xs">
                  Public ledger of moderation decisions made during this active citizen session.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 max-h-[220px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {moderationLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="border-b border-slate-900/5 dark:border-white/5 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">{log.issueTitle}</p>
                          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-450">{log.reason}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>By {log.moderatorName}</span>
                            <span>•</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <Badge className={`uppercase text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                          log.action === "APPROVE"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : log.action === "REJECT"
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : log.action === "ESCALATE"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-sky-50 border-sky-200 text-sky-700"
                        }`}>
                          {log.action}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Reason Modal Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full border-slate-900/10 bg-white/95 dark:border-white/10 dark:bg-slate-900 shadow-2xl p-6 rounded-3xl space-y-4">
            <CardHeader className="p-0 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertOctagon className="h-6 w-6" />
                <CardTitle className="text-xl">Reject Issue Submission</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Provide a reason for rejecting this report. This action will hide the issue from the public list and log the audit reason.
              </CardDescription>
            </CardHeader>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Contains private citizen details violating our doxxing policy (Section 6)."
                className="w-full min-h-[100px] p-3 rounded-2xl border border-slate-900/10 bg-white text-slate-900 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                }}
                variant="ghost"
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={!!actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                {actionLoading === "reject" ? (
                  <div className="h-4 w-4 mr-1.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                Confirm Rejection
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
