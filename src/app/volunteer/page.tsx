import { Badge } from "@/components/ui/badge";
import { VolunteerCard } from "@/components/volunteer-card";
import { DonationCard } from "@/components/donation-card";

export const metadata = {
  title: "Volunteer & Support | Kranti",
  description: "Join as a volunteer moderator or support Kranti through donations.",
};

export default function VolunteerPage() {
  return (
    <div className="bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8 min-h-[calc(100vh-200px)]">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-4 text-center">
          <Badge variant="outline" className="border-slate-900/10 bg-white/80 px-3 py-1 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Get Involved
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Take Action with Kranti</h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            We are a community-driven initiative. Contribute by maintaining our platform's integrity or by helping us stay online.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mt-8">
          <VolunteerCard />
          <DonationCard />
        </div>
      </div>
    </div>
  );
}