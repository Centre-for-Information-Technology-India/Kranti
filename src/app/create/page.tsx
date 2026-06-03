"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  FileText,
  Megaphone,
  ShieldAlert,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ContentType = "issue" | "petition" | "report" | "campaign";

const contentTypes = [
  {
    id: "issue" as ContentType,
    icon: FileText,
    title: "Raise an Issue",
    description: "Report local problems like broken roads, water shortage, sanitation issues, or civic neglect.",
    examples: ["Broken streetlights", "Water contamination", "Garbage not collected", "Pothole on main road"],
    color: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300",
    route: "/issue/new",
  },
  {
    id: "petition" as ContentType,
    icon: Megaphone,
    title: "Start a Petition",
    description: "Demand specific action from authorities with a clear goal and gather public signatures.",
    examples: ["Policy change demand", "Justice for victims", "Environmental protection", "Education reform"],
    color: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300",
    route: "/petition/new",
  },
  {
    id: "report" as ContentType,
    icon: ShieldAlert,
    title: "File an Incident Report",
    description: "Document hate incidents, discrimination, or violence with mandatory evidence for safety.",
    examples: ["Communal hate incident", "Caste discrimination", "Gender violence", "Mob violence"],
    color: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300",
    route: "/report/new",
    warning: "Evidence is mandatory. Reports are moderated for safety.",
  },
  {
    id: "campaign" as ContentType,
    icon: Users,
    title: "Launch a Campaign",
    description: "Organize a broader movement with timelines, milestones, and volunteer coordination.",
    examples: ["Clean water campaign", "Safe streets initiative", "Education access movement"],
    color: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300",
    route: "/campaign/new",
  },
];

export default function CreatePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);

  const handleContinue = () => {
    const selected = contentTypes.find((type) => type.id === selectedType);
    if (selected) {
      router.push(selected.route);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f1ea] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-200/35 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute right-0 top-20 h-96 w-96 translate-x-1/3 rounded-full bg-rose-200/30 blur-3xl dark:bg-rose-900/20" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-900/20" />
      </div>

      <main className="relative mx-auto max-w-7xl px-6 pb-14 pt-14 lg:px-8 lg:pt-20">
        <div className="space-y-8">
          <div className="max-w-3xl space-y-4">
            <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              Create New
            </Badge>
            <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              What would you like to create?
            </h1>
            <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
              Choose the type of civic action that best fits your goal. Each type has different requirements and workflows.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;

              return (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`relative cursor-pointer overflow-hidden border-2 transition-all duration-300 ${
                      isSelected
                        ? "border-slate-950 shadow-xl dark:border-white"
                        : "border-slate-900/10 hover:border-slate-900/30 dark:border-white/10 dark:hover:border-white/30"
                    }`}
                    onClick={() => {
                      setSelectedType(type.id);
                      router.push(type.route);
                    }}
                  >

                    <CardHeader className="space-y-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 ${type.color}`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          {type.title}
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        </CardTitle>
                        <CardDescription className="mt-2 text-base leading-relaxed">
                          {type.description}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {type.warning && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                              {type.warning}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Examples:
                        </p>
                        <ul className="space-y-1.5">
                          {type.examples.map((example, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <span className="text-slate-400">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {selectedType && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center pt-4"
            >
              <Button
                size="lg"
                onClick={handleContinue}
                className="h-14 rounded-full bg-slate-950 px-8 text-lg font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          )}

          <Card className="border-slate-900/10 bg-white/70 shadow-sm dark:border-white/10 dark:bg-slate-900/30">
            <CardHeader>
              <CardTitle className="text-xl">Need help choosing?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                <strong>Issues</strong> are for local, specific problems that need fixing (roads, water, sanitation).
              </p>
              <p>
                <strong>Petitions</strong> are for demanding specific action from authorities with public support.
              </p>
              <p>
                <strong>Reports</strong> are for documenting serious incidents (hate, violence, discrimination) with evidence.
              </p>
              <p>
                <strong>Campaigns</strong> are for broader movements that require coordination and long-term effort.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
