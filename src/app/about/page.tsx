import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VolunteerCard } from "@/components/volunteer-card";
import { DonationCard } from "@/components/donation-card";

const principles = [
  {
    title: "Public accountability",
    text: "Cases should be visible enough to create pressure, but handled with care when they involve sensitive facts or safety risks.",
  },
  {
    title: "Clear reporting",
    text: "People should be able to explain what happened in plain language without needing legal or technical expertise.",
  },
  {
    title: "Safer participation",
    text: "The platform should reduce harm, encourage verification, and avoid exposing unnecessary personal details.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <Badge variant="outline" className="border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-white/5">
          About Kranti
        </Badge>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">A place for citizens to speak up and stay organized.</h1>
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            Kranti is built for people who want to document injustice, find support, and keep a public record of what needs to change.
          </p>
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            It is designed to be simple enough for everyday use and careful enough to handle sensitive civic cases with responsibility.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {principles.map((item) => (
            <Card key={item.title} className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-12">
          <VolunteerCard />
          <DonationCard />
        </div>
      </div>
    </div>
  );
}
