import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, ShieldCheck, AlertTriangle, UserCheck, Gavel, Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Kranti Terms of Service — Rules for lawful, evidence-based civic participation on India's responsible civic action platform. Compliant with IT Rules 2021 and DPDP Act.",
  openGraph: {
    title: "Terms of Service | Kranti",
    description: "Read the terms governing use of Kranti, India's civic action platform.",
    url: "https://kranti.org.in/terms",
  },
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    icon: UserCheck,
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using Kranti (kranti.org.in), you agree to be bound by these Terms of Service and all applicable laws and regulations of India. If you do not agree with any part of these terms, you must not use this platform.",
      "These Terms constitute a legally binding agreement between you and Kranti, operated by Centre for Information Technology India. We reserve the right to update these Terms at any time. Continued use after changes constitutes acceptance.",
      "Users must be at least 18 years of age, or 13 years with verifiable parental consent, to create an account and submit content.",
    ],
  },
  {
    icon: Scale,
    title: "2. Platform Purpose & Permitted Use",
    content: [
      "Kranti is a civic action platform designed exclusively for lawful, evidence-based public participation. The platform enables citizens to raise verified civic issues, file petitions, organise peaceful campaigns, and document incidents of public concern.",
      "Permitted uses include: reporting local civic problems (roads, water, sanitation, healthcare, education), filing petitions demanding lawful government action, organising peaceful awareness campaigns, and documenting incidents with verifiable evidence.",
      "You agree to use Kranti only for its intended civic purpose and not for any commercial, political propaganda, or personal vendetta purposes.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "3. Prohibited Content & Conduct",
    content: [
      "The following content is strictly prohibited and will result in immediate removal and possible account suspension or legal action:",
      "• Hate speech, communal incitement, or content targeting individuals or groups based on religion, caste, gender, ethnicity, or sexual orientation.",
      "• Doxxing — sharing private personal information (home address, phone number, workplace) of any individual without their explicit consent.",
      "• Fabricated allegations, false accusations, or unverified criminal claims against named individuals.",
      "• Direct or indirect calls to violence, mob action, or any form of illegal activity.",
      "• Spam, duplicate submissions, commercial advertising, or content unrelated to civic issues.",
      "• Content that violates the dignity of survivors of sexual violence or minors.",
      "• Impersonation of government officials, public figures, or other users.",
      "Violation of these rules may result in content removal, account suspension, and referral to law enforcement authorities where required by law.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "4. Content Ownership & Licence",
    content: [
      "You retain ownership of all content you submit to Kranti. By submitting content, you grant Kranti a non-exclusive, royalty-free, worldwide licence to display, distribute, and moderate your content for the purpose of operating the platform.",
      "You represent and warrant that you have all necessary rights to the content you submit, including evidence files, photographs, and documents, and that such content does not infringe any third-party intellectual property rights.",
      "Kranti does not claim ownership of user-submitted content. Content may be removed by moderators if it violates these Terms, but removal does not transfer ownership.",
    ],
  },
  {
    icon: Gavel,
    title: "5. Moderation & Enforcement",
    content: [
      "All content submitted to Kranti undergoes a moderation review before becoming publicly visible. Kranti employs a hybrid moderation system combining AI-assisted flagging with human moderator review. Human moderators have final authority over all moderation decisions.",
      "Moderation decisions include: Approve (content is published), Restrict (content is visible only to authenticated users), Reject (content is removed with reason provided to the submitter), and Escalate (content is referred to legal review).",
      "Users may appeal moderation decisions by contacting the Grievance Officer within 15 days of the decision. Appeals are reviewed within 15 working days as required under IT Rules 2021.",
      "Kranti reserves the right to cooperate with law enforcement agencies and provide user data when required by a valid court order or government directive under applicable Indian law.",
    ],
  },
  {
    icon: Scale,
    title: "6. Disclaimer of Warranties",
    content: [
      "Kranti is provided on an 'as is' and 'as available' basis without warranties of any kind, express or implied. We do not warrant that the platform will be uninterrupted, error-free, or free from viruses or other harmful components.",
      "Kranti does not verify the accuracy of user-submitted content and is not responsible for the truthfulness, completeness, or legality of any content posted by users. The platform is a medium for civic expression, not a publisher of verified facts.",
      "Kranti is not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform or reliance on any content published on it.",
    ],
  },
  {
    icon: Gavel,
    title: "7. Governing Law & Jurisdiction",
    content: [
      "These Terms are governed by and construed in accordance with the laws of India, including the Information Technology Act 2000, IT (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021, and the Digital Personal Data Protection Act 2023.",
      "Any disputes arising from these Terms or your use of Kranti shall be subject to the exclusive jurisdiction of the courts located in New Delhi, India.",
      "Kranti operates as an intermediary under Section 2(1)(w) of the IT Act 2000 and complies with all obligations applicable to significant social media intermediaries.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Header */}
        <div className="space-y-4">
          <Badge variant="outline" className="border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-white/5">
            Legal Document
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Terms of Service</h1>
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            Rules for lawful, evidence-based civic participation on Kranti. Please read carefully before using the platform.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: May 2026 · Effective: May 2026 · Governed by Indian law
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.title} className="border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10">
                    <section.icon className="h-4.5 w-4.5 text-slate-700 dark:text-slate-300" />
                  </span>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.content.map((para, i) => (
                  <p key={i} className="text-base leading-7 text-slate-600 dark:text-slate-300">
                    {para}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grievance Officer */}
        <Card className="border-rose-200/60 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-rose-900 dark:text-rose-200">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
                <Gavel className="h-4.5 w-4.5 text-rose-700 dark:text-rose-300" />
              </span>
              Grievance Officer — IT Rules 2021
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-rose-800 dark:text-rose-300">
              As required under Rule 4 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, Kranti has appointed a Grievance Officer to address complaints and concerns from users.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-rose-200/60 bg-white/70 p-4 dark:border-rose-900/30 dark:bg-white/5">
                <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Grievance Officer</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">To be appointed</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Centre for Information Technology India</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-rose-200/60 bg-white/70 p-4 dark:border-rose-900/30 dark:bg-white/5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Email</p>
                  <a href="mailto:grievance@kranti.org.in" className="mt-1 text-sm font-medium text-slate-900 underline underline-offset-2 hover:text-rose-700 dark:text-white dark:hover:text-rose-300">
                    grievance@kranti.org.in
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-rose-200/60 bg-white/70 p-4 dark:border-rose-900/30 dark:bg-white/5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Phone (Business Hours)</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">+91-11-2456-0758</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mon–Fri, 10:00 AM – 6:00 PM IST</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-rose-200/60 bg-white/70 p-4 dark:border-rose-900/30 dark:bg-white/5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Registered Address</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">Centre for Information Technology India</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">New Delhi, India</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-400">
              Grievances are acknowledged within <strong>24 hours</strong> and resolved within <strong>15 working days</strong> as mandated by IT Rules 2021.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          For legal queries, write to{" "}
          <a href="mailto:legal@kranti.org.in" className="underline underline-offset-2 hover:text-slate-600">
            legal@kranti.org.in
          </a>
          . These Terms are subject to change. Check this page periodically.
        </p>
      </div>
    </div>
  );
}
