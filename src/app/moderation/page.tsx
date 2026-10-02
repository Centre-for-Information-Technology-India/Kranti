import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Users, Gavel, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Moderation Policy",
  description:
    "Kranti Moderation Policy — How content is reviewed, approved, restricted, or removed. Hybrid human + AI moderation with clear appeal process. IT Rules 2021 compliant.",
  openGraph: {
    title: "Moderation Policy | Kranti",
    description: "How Kranti moderates content to keep civic discourse safe, lawful, and evidence-based.",
    url: "https://kranti.org.in/moderation",
  },
  alternates: { canonical: "/moderation" },
};

const allowedContent = [
  "Evidence-based reports of civic problems (roads, water, sanitation, healthcare, education, corruption)",
  "Petitions demanding specific, lawful action from government authorities",
  "Peaceful campaign organisation for systemic change",
  "Documentation of communal, caste, or gender-based incidents with verifiable evidence",
  "Constructive criticism of government policies, public institutions, and elected officials",
  "Sharing of RTI responses, court orders, and official documents in the public interest",
  "Factual reporting of police inaction, delayed grievance redressal, or institutional failure",
];

const prohibitedContent = [
  "Hate speech targeting individuals or groups based on religion, caste, gender, ethnicity, or sexual orientation",
  "Doxxing — publishing private personal information (home address, phone, workplace) without consent",
  "Fabricated or unverified criminal allegations against named private individuals",
  "Direct or indirect incitement to violence, mob action, or illegal activity",
  "Content that endangers the safety of survivors of sexual violence or minors",
  "Impersonation of government officials, public figures, journalists, or other users",
  "Spam, duplicate submissions, or content unrelated to civic issues",
  "Commercial advertising, political propaganda, or electoral campaigning",
  "Content that violates court-issued injunctions or gag orders",
];

const moderationSteps = [
  {
    step: "01",
    title: "Submission",
    description: "User submits content. It is immediately assigned a pending_review status and is not publicly visible.",
    color: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  },
  {
    step: "02",
    title: "AI Pre-screening",
    description: "Automated systems check for spam patterns, duplicate content, and obvious policy violations. High-risk content is flagged for priority human review.",
    color: "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
  },
  {
    step: "03",
    title: "Human Review",
    description: "A trained moderator reviews the content, evidence quality, and context. Moderators have final authority — AI flags are advisory only.",
    color: "bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
  },
  {
    step: "04",
    title: "Decision",
    description: "Content is Approved (published), Restricted (authenticated users only), Rejected (removed with reason), or Escalated (legal review).",
    color: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  {
    step: "05",
    title: "Notification",
    description: "The submitter is notified of the decision with a reason. Rejected content includes guidance on how to resubmit if appropriate.",
    color: "bg-purple-50 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300",
  },
];

const appealProcess = [
  "Submit an appeal to the Grievance Officer (Koshik Sharma) at grievance@kranti.org.in within 15 days of the moderation decision.",
  "Include your content ID, the decision you are appealing, and your reasons for the appeal.",
  "A senior moderator (different from the original reviewer) will review your appeal.",
  "You will receive a decision within 15 working days as required under IT Rules 2021.",
  "If you remain unsatisfied, you may escalate to the Data Protection Board of India.",
];

export default function ModerationPage() {
  return (
    <div className="bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Header */}
        <div className="space-y-4">
          <Badge variant="outline" className="border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-white/5">
            Legal Document
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Moderation Policy</h1>
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            How Kranti reviews, approves, and removes content to keep civic discourse safe, lawful, and evidence-based.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: May 2026 · Compliant with IT Rules 2021 · Human moderators have final authority
          </p>
        </div>

        {/* Principles */}
        <Card className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10">
                <ShieldCheck className="h-4.5 w-4.5 text-slate-700 dark:text-slate-300" />
              </span>
              Moderation Principles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
              Kranti uses a hybrid moderation model: AI assists with initial screening, but <strong>human moderators make all final decisions</strong>. We moderate to protect safety and legality, not to suppress legitimate civic expression.
            </p>
            <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
              Our moderation is guided by three principles: <strong>Proportionality</strong> (the response matches the severity of the violation), <strong>Transparency</strong> (decisions are explained and logged publicly), and <strong>Accountability</strong> (all decisions are appealable).
            </p>
          </CardContent>
        </Card>

        {/* Allowed vs Prohibited */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-5 w-5" /> What is Allowed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {allowedContent.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-6 text-emerald-900 dark:text-emerald-200">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-rose-200/60 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-rose-900 dark:text-rose-200">
                <XCircle className="h-5 w-5" /> What is Prohibited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {prohibitedContent.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-6 text-rose-900 dark:text-rose-200">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Moderation Process */}
        <Card className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10">
                <Clock className="h-4.5 w-4.5 text-slate-700 dark:text-slate-300" />
              </span>
              The Moderation Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {moderationSteps.map((step) => (
                <div key={step.step} className="flex items-start gap-4">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${step.color}`}>
                    {step.step}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timelines */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Initial Review", time: "< 24 hours", desc: "All submissions reviewed within 24 hours of receipt", icon: Clock },
            { label: "Full Decision", time: "< 72 hours", desc: "Final moderation decision communicated to submitter", icon: Gavel },
            { label: "Appeal Resolution", time: "15 working days", desc: "Appeals resolved as mandated by IT Rules 2021", icon: Users },
          ].map((item) => (
            <Card key={item.label} className="border-slate-900/10 bg-white/85 text-center dark:border-white/10 dark:bg-white/5">
              <CardContent className="pt-6">
                <item.icon className="mx-auto mb-3 h-6 w-6 text-slate-500" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.time}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Consequences */}
        <Card className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10">
                <AlertTriangle className="h-4.5 w-4.5 text-slate-700 dark:text-slate-300" />
              </span>
              Consequences of Violations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
              Violations are handled proportionally based on severity and intent:
            </p>
            <div className="space-y-2">
              {[
                { level: "Minor", action: "Content removed, warning issued", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
                { level: "Moderate", action: "Content removed, temporary account restriction (7–30 days)", color: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
                { level: "Severe", action: "Content removed, permanent account suspension", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300" },
                { level: "Legal", action: "Content removed, data preserved, referral to law enforcement", color: "bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-300" },
              ].map((row) => (
                <div key={row.level} className="flex items-center gap-3 rounded-xl border border-slate-900/5 bg-slate-50 p-3 dark:border-white/5 dark:bg-white/5">
                  <Badge className={`shrink-0 rounded-full text-xs ${row.color}`}>{row.level}</Badge>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{row.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appeal Process */}
        <Card className="border-blue-200/60 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-blue-900 dark:text-blue-200">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                <Gavel className="h-4.5 w-4.5 text-blue-700 dark:text-blue-300" />
              </span>
              How to Appeal a Decision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {appealProcess.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-6 text-blue-900 dark:text-blue-200">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-900 dark:bg-blue-900/60 dark:text-blue-200">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm font-medium text-blue-800 dark:text-blue-300">
              Appeal email:{" "}
              <a href="mailto:grievance@kranti.org.in" className="underline underline-offset-2">
                grievance@kranti.org.in
              </a>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Moderation decisions are logged and published in our quarterly{" "}
          <a href="/transparency" className="underline underline-offset-2 hover:text-slate-600">
            Transparency Report
          </a>
          .
        </p>
      </div>
    </div>
  );
}
