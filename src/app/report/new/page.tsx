"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, AlertTriangle, ShieldAlert, Upload, Lock, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { browserStorage, ID } from "@/lib/appwrite-browser";
import { incidentTypes, reportDefaultValues, reportSubmissionSchema, type ReportSubmissionValues } from "@/lib/report-form";
import { validateEvidenceFile } from "@/lib/evidence";
import { EvidenceLinksInput } from "@/components/evidence-links-input";

const safetyGuidelines = [
  "Evidence is mandatory for all incident reports to ensure documentation accuracy.",
  "Reports are moderated before publication to protect victims and prevent misuse.",
  "Personal information of victims will be handled with strict confidentiality.",
  "False reports can have serious legal consequences. Report only verified incidents.",
];

export default function NewReportPage() {
  const router = useRouter();
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasEvidence, setHasEvidence] = useState(false);

  const form = useForm<ReportSubmissionValues>({
    resolver: zodResolver(reportSubmissionSchema),
    defaultValues: reportDefaultValues,
    mode: "onTouched",
  });

  async function handleReportSubmit(values: ReportSubmissionValues) {
    const files = Array.from(evidenceInputRef.current?.files ?? []);
    const links = values.evidenceLinks ?? [];
    
    if (files.length === 0 && links.length === 0) {
      setSubmitError("Evidence is mandatory for incident reports. Please upload at least one file or add an evidence link.");
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    try {
      const uploads: Array<{ fileId: string; name: string; size: number; mimeType: string; publicUrl: string }> = [];

      for (const file of files) {
        const validation = validateEvidenceFile(file);
        if (!validation.ok) {
          throw new Error(validation.message);
        }

        const uploaded = await browserStorage.createFile("evidence-files", ID.unique(), file);
        uploads.push({
          fileId: uploaded.$id,
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          publicUrl: browserStorage.getFileView("evidence-files", uploaded.$id).toString(),
        });
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: values,
          evidence: uploads,
        }),
      });

      const body = (await response.json()) as { error?: string; reportSlug?: string };

      if (!response.ok) {
        throw new Error(body.error || "Failed to submit the report.");
      }

      setSubmitted(true);
      form.reset(reportDefaultValues);
      if (evidenceInputRef.current) {
        evidenceInputRef.current.value = "";
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit the report.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f1ea] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-900/20" />
        <div className="absolute right-0 top-24 h-96 w-96 translate-x-1/3 rounded-full bg-rose-200/30 blur-3xl dark:bg-rose-900/20" />
      </div>

      <main className="relative mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
        <section className="space-y-6">
          <div className="space-y-4">
            <Badge variant="outline" className="border-amber-900/20 bg-amber-50 px-3 py-1 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <ShieldAlert className="mr-1 h-3.5 w-3.5" />
              Incident Report
            </Badge>
            <div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Document a serious incident safely.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Incident reports are for documenting hate crimes, discrimination, violence, and harassment with evidence. All reports are moderated for safety.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Important Safety Notice</h3>
                <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                  This form is for serious incidents only. Evidence is mandatory. Reports are reviewed by moderators before publication to ensure victim safety and prevent misuse. False reports may have legal consequences.
                </p>
              </div>
            </div>
          </div>

          {submitted ? (
            <Card className="border-emerald-200 bg-emerald-50/90 shadow-sm shadow-emerald-950/5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <CardHeader>
                <Badge variant="outline" className="w-fit border-emerald-300 bg-white text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                  Submitted for Review
                </Badge>
                <CardTitle className="text-2xl">Your report has been submitted.</CardTitle>
                <CardDescription className="text-base leading-7 text-emerald-900/80 dark:text-emerald-100/80">
                  Our moderation team will review your report carefully. You will be notified once the review is complete. Thank you for documenting this incident.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <Card className="border-slate-900/10 bg-white/90 shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-white/5">
            <CardHeader className="border-b border-slate-900/5 dark:border-white/10">
              <Badge variant="outline" className="w-fit border-slate-900/10 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                Report Form
              </Badge>
              <CardTitle className="text-2xl">Document the incident with evidence.</CardTitle>
              <CardDescription className="text-base leading-7 text-slate-600 dark:text-slate-300">
                Provide detailed, factual information. Evidence is mandatory for all incident reports.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-6">
              <form className="space-y-5" onSubmit={form.handleSubmit(handleReportSubmit)}>
                <div className="grid gap-5">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Report Title</span>
                    <Input
                      {...form.register("title")}
                      placeholder="Example: Communal hate incident at XYZ locality"
                      className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                    />
                    {form.formState.errors.title ? <p className="text-sm text-rose-600">{form.formState.errors.title.message}</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Incident Type</span>
                    <select
                      {...form.register("incidentType")}
                      className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/40"
                    >
                      {incidentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, " ").toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Detailed Description</span>
                    <textarea
                      {...form.register("description")}
                      rows={8}
                      placeholder="Provide a detailed, factual account of what happened. Include: What occurred, when it happened, who was involved (without personal details of victims), and any witnesses. Be specific and objective."
                      className="min-h-[200px] w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/40"
                    />
                    {form.formState.errors.description ? <p className="text-sm text-rose-600">{form.formState.errors.description.message}</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Incident Date</span>
                    <Input
                      {...form.register("incidentDate")}
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                    />
                    {form.formState.errors.incidentDate ? <p className="text-sm text-rose-600">{form.formState.errors.incidentDate.message}</p> : null}
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">State</span>
                      <Input
                        {...form.register("state")}
                        placeholder="Maharashtra"
                        className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                      />
                      {form.formState.errors.state ? <p className="text-sm text-rose-600">{form.formState.errors.state.message}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">District</span>
                      <Input
                        {...form.register("district")}
                        placeholder="Mumbai"
                        className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                      />
                      {form.formState.errors.district ? <p className="text-sm text-rose-600">{form.formState.errors.district.message}</p> : null}
                    </label>
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Landmark / Location (Optional)</span>
                    <Input
                      {...form.register("landmark")}
                      placeholder="Near ABC Market"
                      className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Language</span>
                    <select
                      {...form.register("language")}
                      className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/40"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </label>

                  <label className="space-y-2 rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-600 text-white">
                        <Upload className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          Evidence Upload <span className="text-rose-600">*Required</span>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Photos, videos, documents, or screenshots that document the incident</div>
                      </div>
                    </div>
                    <Input
                      type="file"
                      multiple
                      accept="image/*,video/*,application/pdf"
                      ref={evidenceInputRef}
                      name="evidence"
                      onChange={(e) => setHasEvidence((e.target.files?.length ?? 0) > 0)}
                      className="mt-4 h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                    />
                    {!hasEvidence && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                        ⚠️ Evidence is mandatory for incident reports
                      </p>
                    )}
                  </label>

                  <EvidenceLinksInput
                    value={form.watch("evidenceLinks") ?? []}
                    onChange={(links) => form.setValue("evidenceLinks", links)}
                  />

                  <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <input
                      type="checkbox"
                      {...form.register("evidenceRequired")}
                      className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-600"
                    />
                    <span className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                      I confirm that I have uploaded evidence and understand that reports without evidence cannot be processed.
                    </span>
                  </label>
                  {form.formState.errors.evidenceRequired ? <p className="text-sm text-rose-600">{form.formState.errors.evidenceRequired.message}</p> : null}

                  <label className="flex items-start gap-3 rounded-2xl border border-slate-900/10 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                    <input
                      type="checkbox"
                      {...form.register("consent")}
                      className="mt-1 h-4 w-4 rounded border-slate-400 text-slate-950 focus:ring-slate-950"
                    />
                    <span className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      I confirm this report is accurate to the best of my knowledge and understand it will be reviewed under Kranti&apos;s strict moderation policy. I understand that false reports may have legal consequences.
                    </span>
                  </label>
                  {form.formState.errors.consent ? <p className="text-sm text-rose-600">{form.formState.errors.consent.message}</p> : null}
                </div>

                {submitError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
                    {submitError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Reports are reviewed by moderators before publication to ensure safety.
                  </p>
                  <Button type="submit" size="lg" disabled={isSaving} className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                    {isSaving ? "Submitting..." : "Submit Report"}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-amber-200 bg-amber-50/90 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-amber-300 bg-white text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <Lock className="mr-1 h-3.5 w-3.5" />
                Safety Guidelines
              </Badge>
              <CardTitle className="text-2xl">Important Safety Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {safetyGuidelines.map((guideline, index) => (
                <div key={index} className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-900/40 dark:bg-amber-950/40">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{guideline}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-slate-900/10 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <FileText className="mr-1 h-3.5 w-3.5" />
                What happens next
              </Badge>
              <CardTitle className="text-2xl">Review Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                <strong>1. Moderation Review:</strong> Our team reviews the report and evidence within 24-48 hours.
              </p>
              <p>
                <strong>2. Verification:</strong> Evidence is verified and cross-checked for authenticity.
              </p>
              <p>
                <strong>3. Publication Decision:</strong> Reports are published with appropriate visibility controls to protect victims.
              </p>
              <p>
                <strong>4. Follow-up:</strong> You&apos;ll be notified of the review outcome and any next steps.
              </p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
