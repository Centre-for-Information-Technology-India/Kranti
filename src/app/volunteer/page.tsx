import { Badge } from "@/components/ui/badge";
import { VolunteerCard } from "@/components/volunteer-card";

export const metadata = {
  title: "Volunteer | Kranti",
  description: "Join as a volunteer moderator to help maintain Kranti's integrity.",
};

export default function VolunteerPage() {
  return (
    <div className="bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8 min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="mx-auto max-w-2xl space-y-10 w-full">
        <div className="space-y-4 text-center">
          <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Get Involved
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Volunteer with Kranti</h1>
          <p className="mx-auto max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            We are a community-driven initiative. Contribute by becoming a moderator and helping us maintain our platform's integrity.
          </p>
        </div>

        <div className="mt-8">
          <VolunteerCard />
        </div>
      </div>
    </div>
  );
}