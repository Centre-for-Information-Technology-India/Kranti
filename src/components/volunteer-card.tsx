import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, Users } from "lucide-react";
import Link from "next/link";

export function VolunteerCard() {
  return (
    <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70 overflow-hidden relative">
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-emerald-100/30 blur-3xl dark:bg-emerald-900/20 pointer-events-none" />
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <CardTitle className="text-xl">Join as a Volunteer Moderator</CardTitle>
        </div>
        <CardDescription>
          Help maintain a safe, responsible civic space. Review issues, ensure evidence quality, and support free & fair discourse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 relative z-10">
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
            <span><strong>18+ years old</strong> with a good understanding of Indian civic issues.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
            <span><strong>Neutral & unbiased mindset</strong> required for fair review.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
            <span>Minimum <strong>2-3 hours/week</strong> commitment.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
            <span>Basic verification required (phone/email).</span>
          </li>
        </ul>
        <div className="pt-2">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSeQy55FSU3hmN5_9GHr9AvUqBWEQFxjmkZUqZKehDk0o5M37Q/viewform" target="_blank" rel="noreferrer">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700">
              Apply Now
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}