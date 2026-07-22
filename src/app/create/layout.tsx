import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create — Issue, Petition, Campaign, or Report",
  description:
    "Choose what to create on Kranti — raise a civic issue, file a petition, launch a campaign, or document an incident with evidence.",
  alternates: { canonical: "/create" },
  // Create is a user action funnel, not a content page worth indexing
  robots: { index: false, follow: false },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
