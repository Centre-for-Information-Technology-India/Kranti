"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Share2,
  Tag,
  Target,
  TrendingUp,
  User,
  Users,
  AlertCircle
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PetitionRecord } from "@/lib/content-types";
import { ShareButtons } from "@/components/share-buttons";

export default function PetitionDetailPage() {
  const params = useParams();
  const { user, isLoaded } = useUser();
  const [petition, setPetition] = useState<PetitionRecord | null>(null);
  const [hasSigned, setHasSigned] = useState(false);
  const [isSigningLoading, setIsSigningLoading] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not-found" | "error">("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);

  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    fetch(`/api/petitions/${slug}`, { signal: controller.signal })
      .then((response) => {
        if (response.status === 404) {
          if (!controller.signal.aborted) setLoadState("not-found");
          return null;
        }
        if (!response.ok) throw new Error("Petition request failed");
        return response.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.petition) {
          if (!controller.signal.aborted) {
            setPetition(data.petition);
            setHasSigned(Boolean(data.hasSigned));
            setLoadState("ready");
          }
        } else {
          throw new Error("Invalid petition response");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadState("error");
      });

    return () => controller.abort();
  }, [slug, loadAttempt]);

  async function handleSign() {
    if (!user || !petition) return;

    setIsSigningLoading(true);
    setSignError(null);

    try {
      const response = await fetch(`/api/petitions/${slug}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign petition");
      }

      setHasSigned(true);
      if (data.countUpdated !== false) {
        setPetition((prev) => prev ? { ...prev, signature_count: prev.signature_count + 1 } : null);
      }
    } catch (error) {
      setSignError(error instanceof Error ? error.message : "Failed to sign petition");
    } finally {
      setIsSigningLoading(false);
    }
  }

  if (loadState === "error" || loadState === "not-found") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] px-6 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <div className="w-full max-w-md rounded-2xl border border-slate-900/10 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
          <AlertCircle aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-slate-700 dark:text-slate-200" />
          <h1 className="text-2xl font-semibold">{loadState === "not-found" ? "Petition not found" : "Petition could not load"}</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {loadState === "not-found" ? "This petition may have moved or been removed." : "Please try again. Your connection or the service may be unavailable."}
          </p>
          <div className="mt-6 flex flex-col items-center gap-4">
            {loadState === "error" && (
              <Button onClick={() => { setLoadState("loading"); setLoadAttempt((attempt) => attempt + 1); }} className="min-h-11 bg-slate-900 px-6 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
                Try again
              </Button>
            )}
            <Link href="/petitions" className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
              View petitions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!petition || loadState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent dark:border-white"></div>
          <p className="text-sm text-slate-500">Loading petition...</p>
        </div>
      </div>
    );
  }

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "successful":
        return { color: "text-emerald-700 bg-emerald-50 border-emerald-200", label: "Successful", icon: CheckCircle2 };
      case "in_progress":
        return { color: "text-amber-700 bg-amber-50 border-amber-200", label: "In Progress", icon: Clock };
      case "pending_review":
        return { color: "text-slate-600 bg-slate-50 border-slate-200", label: "Under Review", icon: AlertCircle };
      default:
        return { color: "text-rose-700 bg-rose-50 border-rose-200", label: "Open for Signatures", icon: TrendingUp };
    }
  };

  const statusInfo = getStatusDetails(petition.status);
  const StatusIcon = statusInfo.icon;
  const progress = Math.min(Math.round((petition.signature_count / petition.signature_goal) * 100), 100);

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-rose-100/20 blur-3xl dark:bg-rose-900/10" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`border flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-600">
              <Tag className="mr-1 h-3 w-3" />
              {petition.category.replace("_", " ").toUpperCase()}
            </Badge>
            <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-600">
              <MapPin className="mr-1 h-3 w-3" />
              {petition.state}
            </Badge>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{petition.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Started by <strong>{petition.creatorName}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(petition.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>
        </div>

        <Card className="border-slate-900/10 bg-white/90 shadow-lg dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader className="border-b border-slate-900/5 dark:border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {petition.signature_count.toLocaleString()} signatures
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Goal: {petition.signature_goal.toLocaleString()} signatures
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-rose-600">{progress}%</div>
                <div className="text-xs text-slate-500">Complete</div>
              </div>
            </div>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoaded && user ? (
              hasSigned ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  <p className="font-semibold text-emerald-900 dark:text-emerald-100">You&apos;ve signed this petition</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">Thank you for your support!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={handleSign}
                    disabled={isSigningLoading}
                    size="lg"
                    className="w-full h-14 rounded-2xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 text-lg font-semibold"
                  >
                    {isSigningLoading ? "Signing..." : "Sign this petition"}
                  </Button>
                  {signError && (
                    <p className="text-sm text-rose-600 text-center">{signError}</p>
                  )}
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
                <p className="text-slate-600 dark:text-slate-300">
                  <Link href="/sign-in" className="font-semibold text-slate-950 hover:underline dark:text-white">Sign in</Link> to sign this petition
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Background
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-line leading-relaxed">{petition.description}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Target className="h-5 w-5 text-rose-600" />
                  Our Demand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border-l-4 border-rose-500 bg-rose-50/50 p-4 dark:bg-rose-950/20">
                  <p className="font-medium leading-relaxed whitespace-pre-line">{petition.demand}</p>
                </div>
              </CardContent>
            </Card>

            {petition.evidence.length > 0 && (
              <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="text-xl">Supporting Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {petition.evidence.map((file) => (
                      <div
                        key={file.fileId}
                        className="group relative overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-50 dark:border-white/10 dark:bg-slate-950/40"
                      >
                        {file.mimeType.startsWith("image/") ? (
                          <img src={file.publicUrl} alt={file.name} className="h-48 w-full object-cover" />
                        ) : (
                          <div className="flex h-48 items-center justify-center bg-slate-100 dark:bg-slate-900">
                            <FileText className="h-12 w-12 text-slate-400" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-xs font-medium truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-lg">Target Authority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-900 dark:text-white">{petition.targetAuthority}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                    This petition will be delivered to the above authority when the signature goal is reached.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share this petition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ShareButtons
                  url={typeof window !== "undefined" ? window.location.href : ""}
                  title={petition.title}
                  description={`Sign this petition: ${petition.title}`}
                />
              </CardContent>
            </Card>

            <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recent Supporters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {petition.signature_count} people have signed this petition
                  </p>
                  <div className="text-xs text-slate-500">
                    Join them in demanding change
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
