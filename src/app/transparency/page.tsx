"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  DollarSign,
  History,
  FileText,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VolunteerCard } from "@/components/volunteer-card";
import { DonationCard } from "@/components/donation-card";

type TransparencyData = {
  available: boolean;
  totalIssues: number;
  resolvedIssues: number;
};

export default function TransparencyPage() {
  const [data, setData] = useState<TransparencyData | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/transparency", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("request failed"))))
      .then((json: TransparencyData) => {
        if (!cancelled) {
          if (json?.available) setData(json);
          else setUnavailable(true);
        }
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const countValue = (value: number | null) =>
    value === null ? (unavailable ? "Unavailable" : "…") : String(value);

  return (
    <div className="relative min-h-screen bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-10 top-10 h-80 w-80 rounded-full bg-emerald-100/20 blur-3xl dark:bg-emerald-900/5" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-10">
        
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              Trust & Audit Portal
            </Badge>
            <Badge variant="outline" className="border-amber-500/30 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-300">
              Public beta
            </Badge>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Transparency Dashboard</h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Live counts from the platform registry. Figures we cannot yet verify from real data are marked unavailable rather than estimated.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Issues Raised", value: countValue(data ? data.totalIssues : null), icon: FileText, desc: "Platform registry size", color: "text-slate-700 bg-slate-100 dark:bg-white/5 dark:text-slate-300" },
            { label: "Issues Resolved", value: countValue(data ? data.resolvedIssues : null), icon: CheckCircle2, desc: "Marked resolved on the platform", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-300" },
            { label: "Avg. Turnaround Time", value: "Unavailable", icon: Clock, desc: "Public beta — not yet measured", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-300" },
            { label: "Moderation Accuracy", value: "Unavailable", icon: TrendingUp, desc: "Public beta — not yet measured", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-300" }
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardDescription className="text-sm font-medium">{item.label}</CardDescription>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
                    <item.icon className="h-4.5 w-4.5" />
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Financial Transparency */}
        <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-xl">Financial Transparency & Infrastructure Costs</CardTitle>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-300">
                Public beta
              </Badge>
            </div>
            <CardDescription>
              We operate as public civic infrastructure. Verified funding breakdowns will be published here as our reporting matures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed border-slate-900/15 bg-slate-50/60 p-6 text-center dark:border-white/10 dark:bg-slate-950/40">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Detailed donation and expense figures are unavailable during the public beta.
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                We publish only numbers we can verify — no estimates, no placeholders.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Community & Support */}
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <VolunteerCard />
          <DonationCard />
        </div>

        {/* Public Audit Logs */}
        <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-xl">Public Moderation Audit Log</CardTitle>
            </div>
            <CardDescription>
              Moderation records stay private until a safe public record is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed border-slate-900/15 bg-slate-50/60 p-6 text-center dark:border-white/10 dark:bg-slate-950/40">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Public moderation records are not available yet.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* IT Rules Notice */}
        <div className="rounded-3xl border border-dashed border-slate-900/20 bg-white/50 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/30 dark:text-slate-400 leading-relaxed text-center">
          📜 <strong>Information Technology Rules, 2021 Compliance</strong>: Grievances are formally acknowledged within 24 hours and addressed within 15 working days. Weekly statistics are verified by our Nodal Officer. Contact <strong>grievance@kranti.org.in</strong> for appeals.
        </div>

      </div>
    </div>
  );
}
