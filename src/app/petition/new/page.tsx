"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, FileText, Megaphone, Sparkles, Upload, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { browserStorage, ID } from "@/lib/appwrite-browser";
import { petitionCategories, petitionDefaultValues, petitionSubmissionSchema, type PetitionSubmissionValues } from "@/lib/petition-form";
import { validateEvidenceFile } from "@/lib/evidence";
import { EvidenceLinksInput } from "@/components/evidence-links-input";

const checklist = [
  "State a clear, specific demand directed at the appropriate authority.",
  "Explain why this change matters and who it affects.",
  "Attach supporting evidence (documents, photos, reports) when available.",
  "Set a realistic signature goal based on the scope of your petition.",
];

const nextSteps = [
  {
    title: "Moderation review",
    text: "Your petition will be reviewed to ensure it meets platform guidelines and is directed at the correct authority.",
  },
  {
    title: "Public campaign",
    text: "Once approved, your petition goes live and citizens can sign to show their support.",
  },
  {
    title: "Delivery to authority",
    text: "When your goal is reached, we help you deliver the petition to the target authority with full transparency.",
  },
];

export default function NewPetitionPage() {
  const router = useRouter();
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PetitionSubmissionValues>({
    resolver: zodResolver(petitionSubmissionSchema),
    defaultValues: petitionDefaultValues,
    mode: "onTouched",
  });

  async function handlePetitionSubmit(values: PetitionSubmissionValues) {
    setIsSaving(true);
    setSubmitError(null);

    try {
      const files = Array.from(evidenceInputRef.current?.files ?? []);
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

      const response = await fetch("/api/petitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: values,
          evidence: uploads,
        }),
      });

      const body = (await response.json()) as { error?: string; petitionSlug?: string };

      if (!response.ok) {
        throw new Error(body.error || "Failed to save the petition.");
      }

      setSubmitted(true);
      form.reset(petitionDefaultValues);
      if (evidenceInputRef.current) {
        evidenceInputRef.current.value = "";
      }
      if (body.petitionSlug) {
        router.push(`/petitions/${body.petitionSlug}`);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save the petition.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f1ea] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-900/20" />
        <div className="absolute right-0 top-24 h-96 w-96 translate-x-1/3 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-900/20" />
      </div>

      <main className="relative mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
        <section className="space-y-6">
          <div className="space-y-4">
            <Badge variant="outline" className="border-slate-900/10 bg-white/80 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <Megaphone className="mr-1 h-3.5 w-3.5" />
              New petition
            </Badge>
            <div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Start a petition for change.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Petitions are powerful tools for demanding specific action from authorities. State your demand clearly, gather public support, and deliver it to decision-makers.
              </p>
            </div>
          </div>

          {submitted ? (
            <Card className="border-emerald-200 bg-emerald-50/90 shadow-sm shadow-emerald-950/5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <CardHeader>
                <Badge variant="outline" className="w-fit border-emerald-300 bg-white text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                  Submitted
                </Badge>
                <CardTitle className="text-2xl">Your petition is under review.</CardTitle>
                <CardDescription className="text-base leading-7 text-emerald-900/80 dark:text-emerald-100/80">
                  Once approved, your petition will be live and ready to collect signatures from supporters across India.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <Card className="border-slate-900/10 bg-white/90 shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-white/5">
            <CardHeader className="border-b border-slate-900/5 dark:border-white/10">
              <Badge variant="outline" className="w-fit border-slate-900/10 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                Petition form
              </Badge>
              <CardTitle className="text-2xl">Make your demand clear and specific.</CardTitle>
              <CardDescription className="text-base leading-7 text-slate-600 dark:text-slate-300">
                The more specific your demand, the easier it is for authorities to act and for citizens to support you.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-6">
              <form className="space-y-5" onSubmit={form.handleSubmit(handlePetitionSubmit)}>
                <div className="grid gap-5">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Petition Title</span>
                    <Input
                      {...form.register("title")}
                      placeholder="Example: Demand immediate action on water contamination in Bhopal"
                      className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                    />
                    {form.formState.errors.title ? <p className="text-sm text-rose-600">{form.formState.errors.title.message}</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Background & Context</span>
                    <textarea
                      {...form.register("description")}
                      rows={6}
                      placeholder="Explain the problem, who is affected, and why action is needed now. Provide context and background information."
                      className="min-h-[150px] w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/40"
                    />
                    {form.formState.errors.description ? <p className="text-sm text-rose-600">{form.formState.errors.description.message}</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Specific Demand</span>
                    <textarea
                      {...form.register("demand")}
                      rows={4}
                      placeholder="What exactly do you want the authority to do? Be specific: 'Install 50 water purification units in affected areas within 60 days' is better than 'Fix the water problem.'"
                      className="min-h-[100px] w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/40"
                    />
                    {form.formState.errors.demand ? <p className="text-sm text-rose-600">{form.formState.errors.demand.message}</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Target Authority</span>
                    <Input
                      {...form.register("targetAuthority")}
                      placeholder="Example: Chief Minister of Madhya Pradesh, Municipal Corporation Commissioner"
                      className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                    />
                    {form.formState.errors.targetAuthority ? <p className="text-sm text-rose-600">{form.formState.errors.targetAuthority.message}</p> : null}
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</span>
                      <select
                        {...form.register("category")}
                        className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/40"
                      >
                        {petitionCategories.map((category) => (
                          <option key={category} value={category}>
                            {category.replace("_", " ").toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Signature Goal</span>
                      <Input
                        {...form.register("signatureGoal", { valueAsNumber: true })}
                        type="number"
                        min="10"
                        max="10000000"
                        placeholder="1000"
                        className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                      />
                      {form.formState.errors.signatureGoal ? <p className="text-sm text-rose-600">{form.formState.errors.signatureGoal.message}</p> : null}
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">State</span>
                      <Input
                        {...form.register("state")}
                        placeholder="Madhya Pradesh"
                        className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                      />
                      {form.formState.errors.state ? <p className="text-sm text-rose-600">{form.formState.errors.state.message}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">District (Optional)</span>
                      <Input
                        {...form.register("district")}
                        placeholder="Bhopal"
                        className="h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Evidence Level</span>
                      <select
                        {...form.register("evidenceLevel")}
                        className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 text-base outline-none transition focus:border-slate-950 dark:border-white/10 dark:bg-white/5 dark:focus:border-white/40"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
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
                  </div>

                  <label className="space-y-2 rounded-3xl border border-dashed border-slate-900/15 bg-slate-50/90 p-5 dark:border-white/15 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                        <Upload className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Supporting Evidence</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Documents, reports, photos that support your petition</div>
                      </div>
                    </div>
                    <Input
                      type="file"
                      multiple
                      accept="image/*,video/*,application/pdf"
                      ref={evidenceInputRef}
                      name="evidence"
                      className="mt-4 h-12 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
                    />
                  </label>

                  <EvidenceLinksInput
                    value={form.watch("evidenceLinks") ?? []}
                    onChange={(links) => form.setValue("evidenceLinks", links)}
                  />

                  <label className="flex items-start gap-3 rounded-2xl border border-slate-900/10 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                    <input
                      type="checkbox"
                      {...form.register("consent")}
                      className="mt-1 h-4 w-4 rounded border-slate-400 text-slate-950 focus:ring-slate-950"
                    />
                    <span className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      I confirm this petition is accurate and I understand it will be reviewed under Kranti&apos;s moderation policy before going live.
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
                    Petitions are reviewed before publication to ensure they meet platform guidelines.
                  </p>
                  <Button type="submit" size="lg" disabled={isSaving} className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                    {isSaving ? "Saving..." : "Submit petition"}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-slate-900/10 bg-white/90 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Petition checklist
              </Badge>
              <CardTitle className="text-2xl">What makes a strong petition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-900/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-rose-600" />
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-900/10 bg-white/90 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <Users className="mr-1 h-3.5 w-3.5" />
                After submission
              </Badge>
              <CardTitle className="text-2xl">How your petition grows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextSteps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-slate-900/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                      {index + 1}
                    </span>
                    <div className="font-medium text-slate-950 dark:text-white">{step.title}</div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.text}</p>
                </div>
              ))}
            </CardContent>
            <CardFooter className="bg-slate-50/80 dark:bg-white/5">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <FileText className="h-4 w-4" />
                Your petition can drive real change when enough citizens stand together.
              </div>
            </CardFooter>
          </Card>
        </aside>
      </main>
    </div>
  );
}
