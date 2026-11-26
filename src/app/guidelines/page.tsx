import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Community Guidelines",
  description:
    "Evidence first, safety first. Kranti reviews content to reduce harm, false accusations, and abuse.",
  path: "/guidelines",
});

export default function GuidelinesPage() {
  return (
    <div className="bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <Badge variant="outline" className="border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-white/5">
          Moderation Guidelines
        </Badge>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Evidence first, safety first.</h1>
          <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
            Kranti reviews content to reduce harm, false accusations, and abuse. Moderators may restrict, escalate, or remove content that breaks policy.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="text-2xl">Allowed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
                Clear civic complaints, supporting evidence, lawful escalation steps, and respectful discussion around the issue.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="text-2xl">Not allowed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
                Doxxing, hate speech, direct threats, incitement, fabricated allegations, and anything that risks survivor or witness safety.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-2xl">Appeals and contact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
              If you believe moderation was incorrect, email legal@kranti.org.in with the issue slug, context, and a short explanation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
