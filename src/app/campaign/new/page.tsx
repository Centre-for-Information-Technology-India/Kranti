"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Loader2, Users, Calendar, Target, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { campaignFormSchema, type CampaignFormData, campaignCategories, indianStates } from "@/lib/campaign-form";
import { useFormAutoSave } from "@/lib/use-form-autosave";

export default function NewCampaignPage() {
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: "",
      description: "",
      goals: "",
      category: "other",
      state: "",
      startDate: "",
      endDate: "",
      language: "en",
    },
  });

  const { clear: clearDraft } = useFormAutoSave(form, "kranti_campaign_draft");

  const onSubmit = async (data: CampaignFormData) => {
    if (!isSignedIn || !userId) {
      setSubmitError("Please sign in to create a campaign.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create campaign");
      }

      const result = await response.json();
      clearDraft();
      router.push(`/campaigns/${result.slug}`);
    } catch (error) {
      console.error("Campaign creation error:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] dark:bg-slate-950">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You need to be signed in to create a campaign.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f1ea] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-900/20" />
        <div className="absolute right-0 top-20 h-96 w-96 translate-x-1/3 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-900/20" />
      </div>

      <main className="relative mx-auto max-w-4xl px-6 pb-14 pt-14 lg:px-8 lg:pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <Users className="mr-1.5 h-3.5 w-3.5" />
              New Campaign
            </Badge>
            <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              Launch a Campaign
            </h1>
            <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
              Organize a broader movement with timelines, milestones, and volunteer coordination for lasting change.
            </p>
          </div>

          <Card className="border-slate-900/10 bg-white/85 shadow-lg dark:border-white/10 dark:bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-2xl">Campaign Details</CardTitle>
              <CardDescription>
                Provide clear information about your campaign goals and how people can get involved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Campaign Title *</span>
                  <Input
                    {...form.register("title")}
                    placeholder="e.g., Clean Water for All Villages in Bihar"
                    className="h-12 rounded-2xl border-slate-900/10 bg-white dark:border-white/10 dark:bg-slate-950"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-rose-600">{form.formState.errors.title.message}</p>
                  )}
                  <p className="text-xs text-slate-500">A clear, compelling title (10-200 characters)</p>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Description *</span>
                  <textarea
                    {...form.register("description")}
                    placeholder="Describe the problem, why this campaign matters, and what you hope to achieve..."
                    rows={8}
                    className="min-h-[200px] w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-950 dark:border-white/10 dark:bg-slate-950 dark:focus:border-white/40"
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-rose-600">{form.formState.errors.description.message}</p>
                  )}
                  <p className="text-xs text-slate-500">Detailed explanation (50-5000 characters)</p>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Campaign Goals *
                  </span>
                  <textarea
                    {...form.register("goals")}
                    placeholder="List specific, measurable goals for this campaign..."
                    rows={5}
                    className="min-h-[140px] w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-950 dark:border-white/10 dark:bg-slate-950 dark:focus:border-white/40"
                  />
                  {form.formState.errors.goals && (
                    <p className="text-sm text-rose-600">{form.formState.errors.goals.message}</p>
                  )}
                  <p className="text-xs text-slate-500">Specific outcomes you want to achieve (20-2000 characters)</p>
                </label>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Category *</span>
                    <select
                      {...form.register("category")}
                      className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-slate-950 dark:focus:border-white/40"
                    >
                      {campaignCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.category && (
                      <p className="text-sm text-rose-600">{form.formState.errors.category.message}</p>
                    )}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">State *</span>
                    <select
                      {...form.register("state")}
                      className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-slate-950 dark:focus:border-white/40"
                    >
                      <option value="">Select state</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.state && (
                      <p className="text-sm text-rose-600">{form.formState.errors.state.message}</p>
                    )}
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date (Optional)
                    </span>
                    <Input
                      type="date"
                      {...form.register("startDate")}
                      className="h-12 rounded-2xl border-slate-900/10 bg-white dark:border-white/10 dark:bg-slate-950"
                    />
                    <p className="text-xs text-slate-500">When does this campaign begin?</p>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date (Optional)
                    </span>
                    <Input
                      type="date"
                      {...form.register("endDate")}
                      className="h-12 rounded-2xl border-slate-900/10 bg-white dark:border-white/10 dark:bg-slate-950"
                    />
                    <p className="text-xs text-slate-500">Target completion date</p>
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Language *</span>
                  <select
                    {...form.register("language")}
                    className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-slate-950 dark:focus:border-white/40"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </label>

                {submitError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
                    {submitError}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Campaign...
                      </>
                    ) : (
                      <>
                        Create Campaign
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="h-12 rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-900/10 bg-white/70 shadow-sm dark:border-white/10 dark:bg-slate-900/30">
            <CardHeader>
              <CardTitle className="text-xl">Campaign Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                <strong>Be specific:</strong> Clearly define your goals and what success looks like.
              </p>
              <p>
                <strong>Stay focused:</strong> Campaigns work best when they address a specific issue with clear demands.
              </p>
              <p>
                <strong>Build support:</strong> Engage volunteers and supporters to amplify your message.
              </p>
              <p>
                <strong>Track progress:</strong> Update your campaign regularly with milestones and achievements.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
