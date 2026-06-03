import { Badge } from "@/components/ui/badge";
import { DonationCard } from "@/components/donation-card";
import Link from "next/link";

export const metadata = {
  title: "Support Kranti | Responsible Civic Platform for India",
  description: "Kranti is an open-source, non-profit civic platform built to help citizens raise issues, launch petitions, document evidence, and push for real change.",
};

export default function DonatePage() {
  return (
    <div className="bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8 min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="mx-auto max-w-5xl space-y-12 w-full">
        <div className="space-y-6 text-center">
          <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Support Our Mission
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Support Kranti</h1>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Kranti is an open-source, non-profit civic platform built to help citizens raise issues, launch petitions, document evidence, and push for real change — peacefully and lawfully.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 mt-8 items-start">
          <div className="space-y-6 text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
            <p>
              We believe in transparency, evidence, and civic education. Your donation directly helps us:
            </p>
            <ul className="space-y-3 list-disc list-inside ml-2 text-base">
              <li>Keep the platform free for all citizens</li>
              <li>Maintain strong moderation & safety</li>
              <li>Create practical guides (RTI, FIR, complaints)</li>
              <li>Cover server and development costs</li>
            </ul>
            <div className="p-5 bg-white/60 dark:bg-white/5 rounded-xl border border-slate-900/5 dark:border-white/10 mt-8">
              <p className="text-base">
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">100% Transparent</strong> — We publish monthly funding and expense reports on our <Link href="/transparency" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Transparency page</Link>.
              </p>
            </div>
          </div>

          <div className="max-w-md mx-auto w-full">
            <DonationCard />
          </div>
        </div>
      </div>
    </div>
  );
}
