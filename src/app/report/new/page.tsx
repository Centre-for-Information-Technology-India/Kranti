"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import { useFormAutoSave } from "@/lib/use-form-autosave";

export default function NewReportPage() {
  const t = useTranslations("reportForm");
  const locale = useLocale();
  const incidentLabels = useTranslations("reports.incidentTypes");
  const safetyGuidelines = [t("guideline1"), t("guideline2"), t("guideline3"), t("guideline4")];
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const previousLocale = useRef(locale);
  const [submitted, setSubmitted] = useState(false);
  const [savedWithoutEvidence, setSavedWithoutEvidence] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasEvidence, setHasEvidence] = useState(false);

  const form = useForm<ReportSubmissionValues>({
    resolver: zodResolver(reportSubmissionSchema),
    defaultValues: { ...reportDefaultValues, language: locale === "hi" ? "hi" : "en" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (previousLocale.current !== locale) {
      const previousLanguage = previousLocale.current === "hi" ? "hi" : "en";
      if (form.getValues("language") === previousLanguage) {
        form.setValue("language", locale === "hi" ? "hi" : "en");
      }
      previousLocale.current = locale;
    }
  }, [form, locale]);

  const errorText = (message: string | undefined) => {
    const keys: Record<string, string> = {
      "Title must be at least 10 characters": "titleShort",
      "Title too long": "titleLong",
      "Description must be at least 100 characters for safety documentation": "descriptionShort",
      "Incident date is required": "dateRequired",
      "State is required": "stateRequired",
      "State must not exceed 100 characters": "stateLong",
      "District is required": "districtRequired",
      "District must not exceed 100 characters": "districtLong",
      "Evidence is mandatory for incident reports": "evidenceRequiredValidation",
      "You must agree to the terms": "consentRequired",
    };
    const key = message && keys[message];
    return key ? t(`validation.${key}`) : message ?? "";
  };

  const { clear: clearDraft } = useFormAutoSave(form, "kranti_report_draft");

  async function handleReportSubmit(values: ReportSubmissionValues) {
    if (submitted) return;
    const files = Array.from(evidenceInputRef.current?.files ?? []);
    const links = values.evidenceLinks ?? [];
    
    if (files.length === 0 && links.length === 0) {
      setSubmitError(t("evidenceMissingError"));
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

      const body = (await response.json()) as { error?: string; reportId?: string; evidenceSaved?: boolean };

      if (!response.ok) {
        throw new Error(body.error || t("submitFailed"));
      }

      setSubmitted(true);
      if (body.evidenceSaved === false) {
        setSavedWithoutEvidence(body.reportId ?? "saved");
        return;
      }
      clearDraft();
      form.reset({ ...reportDefaultValues, language: locale === "hi" ? "hi" : "en" });
      if (evidenceInputRef.current) {
        evidenceInputRef.current.value = "";
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("submitFailed"));
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
              {t("badge")}
            </Badge>
            <div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                {t("headline")}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                {t("intro")}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">{t("noticeTitle")}</h3>
                <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                  {t("notice")}
                </p>
              </div>
            </div>
          </div>

          {submitted ? (
            <Card className={savedWithoutEvidence ? "border-amber-300 bg-amber-50/90 shadow-sm dark:border-amber-800 dark:bg-amber-950/20" : "border-emerald-200 bg-emerald-50/90 shadow-sm shadow-emerald-950/5 dark:border-emerald-900/40 dark:bg-emerald-950/20"}>
              <CardHeader>
                <Badge variant="outline" className={savedWithoutEvidence ? "w-fit border-amber-400 bg-white text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200" : "w-fit border-emerald-300 bg-white text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"}>
                  {savedWithoutEvidence ? t("savedBadge") : t("submittedBadge")}
                </Badge>
                <CardTitle className="text-2xl">{savedWithoutEvidence ? t("savedTitle") : t("submittedTitle")}</CardTitle>
                <CardDescription className={savedWithoutEvidence ? "text-base leading-7 text-amber-950 dark:text-amber-100" : "text-base leading-7 text-emerald-900/80 dark:text-emerald-100/80"}>
                  {savedWithoutEvidence ? t("savedDescription") : t("submittedDescription")}
                </CardDescription>
                {savedWithoutEvidence ? <p className="text-sm text-amber-950 dark:text-amber-100">{t("reference")} {savedWithoutEvidence}</p> : null}
                {savedWithoutEvidence ? <a className="w-fit text-sm font-semibold text-slate-900 underline underline-offset-4 dark:text-white" href="mailto:grievance@kranti.org.in">{t("contact")}</a> : null}
              </CardHeader>
            </Card>
          ) : null}

          <Card className="border-slate-900/10 bg-white/90 shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-white/5">
            <CardHeader className="border-b border-slate-900/5 dark:border-white/10">
              <Badge variant="outline" className="w-fit border-slate-900/10 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                {t("formBadge")}
              </Badge>
              <CardTitle className="text-2xl">{t("formTitle")}</CardTitle>
              <CardDescription className="text-base leading-7 text-slate-600 dark:text-slate-300">
                {t("formDescription")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-6">
              <form className="space-y-5" onSubmit={form.handleSubmit(handleReportSubmit)}>
                <div className="grid gap-5">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("reportTitle")}</span>
                    <Input
                      {...form.register("title")}
                      placeholder={t("reportTitlePlaceholder")}
                      className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                    />
                    {form.formState.errors.title ? <p className="text-sm text-rose-600">{errorText(form.formState.errors.title.message)}</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("incidentType")}</span>
                    <select
                      {...form.register("incidentType")}
                      className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/40"
                    >
                      {incidentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type === "other" ? t("other") : incidentLabels(type)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("description")}</span>
                    <textarea
                      {...form.register("description")}
                      rows={8}
                      placeholder={t("descriptionPlaceholder")}
                      className="min-h-[200px] w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/40"
                    />
                    {form.formState.errors.description ? <p className="text-sm text-rose-600">{errorText(form.formState.errors.description.message)}</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("incidentDate")}</span>
                    <Input
                      {...form.register("incidentDate")}
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                    />
                    {form.formState.errors.incidentDate ? <p className="text-sm text-rose-600">{errorText(form.formState.errors.incidentDate.message)}</p> : null}
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("state")}</span>
                      <Input
                        {...form.register("state")}
                        placeholder="Maharashtra"
                        className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                      />
                      {form.formState.errors.state ? <p className="text-sm text-rose-600">{errorText(form.formState.errors.state.message)}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("district")}</span>
                      <Input
                        {...form.register("district")}
                        placeholder="Mumbai"
                        className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                      />
                      {form.formState.errors.district ? <p className="text-sm text-rose-600">{errorText(form.formState.errors.district.message)}</p> : null}
                    </label>
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("landmark")}</span>
                    <Input
                      {...form.register("landmark")}
                      placeholder={t("landmarkPlaceholder")}
                      className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("language")}</span>
                    <select
                      {...form.register("language")}
                      className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/40"
                    >
                      <option value="en">{t("english")}</option>
                      <option value="hi">{t("hindi")}</option>
                    </select>
                  </label>

                  <label className="space-y-2 rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-600 text-white">
                        <Upload className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          {t("evidenceUpload")} <span className="text-rose-600">{t("required")}</span>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{t("evidenceHelp")}</div>
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
                        {t("evidenceWarning")}
                      </p>
                    )}
                  </label>

                  <EvidenceLinksInput
                    labels={{ title: t("linksTitle"), help: t("linksHelp"), invalid: t("linksInvalid"), duplicate: t("linksDuplicate") }}
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
                      {t("evidenceConfirm")}
                    </span>
                  </label>
                  {form.formState.errors.evidenceRequired ? <p className="text-sm text-rose-600">{errorText(form.formState.errors.evidenceRequired.message)}</p> : null}

                  <label className="flex items-start gap-3 rounded-2xl border border-slate-900/10 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                    <input
                      type="checkbox"
                      {...form.register("consent")}
                      className="mt-1 h-4 w-4 rounded border-slate-400 text-slate-950 focus:ring-slate-950"
                    />
                    <span className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {t("consent")}
                    </span>
                  </label>
                  {form.formState.errors.consent ? <p className="text-sm text-rose-600">{errorText(form.formState.errors.consent.message)}</p> : null}
                </div>

                {submitError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
                    {submitError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {t("footerNotice")}
                  </p>
                  <Button type="submit" size="lg" disabled={isSaving || submitted} className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                    {isSaving ? t("submitting") : t("submit")}
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
                {t("safetyBadge")}
              </Badge>
              <CardTitle className="text-2xl">{t("safetyTitle")}</CardTitle>
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
                {t("nextBadge")}
              </Badge>
              <CardTitle className="text-2xl">{t("nextTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                <strong>1. {t("next1Title")}</strong> {t("next1")}
              </p>
              <p>
                <strong>2. {t("next2Title")}</strong> {t("next2")}
              </p>
              <p>
                <strong>3. {t("next3Title")}</strong> {t("next3")}
              </p>
              <p>
                <strong>4. {t("next4Title")}</strong> {t("next4")}
              </p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
