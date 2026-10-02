import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, Database, UserCheck, Trash2, Globe, ShieldAlert, Mail } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Kranti Privacy Policy — How we collect, use, and protect your personal data. Compliant with India's Digital Personal Data Protection Act 2023 and IT Rules 2021.",
  path: "/privacy",
  socialDescription: "How Kranti collects, uses, and protects your personal data under Indian law.",
});

const sections = [
  {
    icon: Database,
    title: "1. Data We Collect",
    content: [
      "Account Data: When you register, we collect your name, email address, and phone number via Clerk authentication. Phone OTP verification is used to confirm identity.",
      "Content Data: Issues, petitions, campaigns, and reports you submit, including titles, descriptions, location data (state, district, landmark), and category information.",
      "Evidence Files: Photographs, videos, and documents you upload as evidence. These are stored securely in our Appwrite storage with encryption at rest.",
      "Usage Data: IP address, browser type, device information, pages visited, and interaction logs for security and platform improvement purposes.",
      "Communication Data: Messages sent to our support or grievance team.",
      "We do not collect Aadhaar numbers, PAN numbers, financial account details, or biometric data.",
    ],
  },
  {
    icon: Eye,
    title: "2. How We Use Your Data",
    content: [
      "To operate the platform: Display your submitted content, enable support/signature features, send notifications about your content.",
      "For moderation: Review submitted content for compliance with our community guidelines and legal obligations.",
      "For safety: Detect and prevent abuse, spam, fake accounts, and illegal content.",
      "For communication: Send you notifications about your content status, moderation decisions, and platform updates.",
      "For legal compliance: Respond to valid court orders, government directives, and law enforcement requests as required under Indian law.",
      "We do not sell, rent, or trade your personal data to third parties for commercial purposes.",
    ],
  },
  {
    icon: Globe,
    title: "3. Data Sharing & Disclosure",
    content: [
      "Public Content: Issues, petitions, and campaigns you mark as public are visible to all visitors. Your display name is shown alongside your content.",
      "Incident Reports: Reports are visible only to authenticated users and moderators by default, given their sensitive nature.",
      "Service Providers: We use Clerk (authentication), Appwrite (database and storage), and Vercel (hosting). These providers process data on our behalf under data processing agreements.",
      "Law Enforcement: We may disclose data to government authorities when required by a valid court order, warrant, or legal directive under the IT Act 2000 or DPDP Act 2023. We will notify affected users unless prohibited by law.",
      "We do not share data with advertisers, data brokers, or political organisations.",
    ],
  },
  {
    icon: Lock,
    title: "4. Data Security",
    content: [
      "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.",
      "Evidence files are scanned for viruses and malware upon upload.",
      "Access to the database is restricted to authorised personnel only, using role-based access controls.",
      "We conduct regular security audits and vulnerability assessments.",
      "In the event of a data breach affecting your personal data, we will notify you within 72 hours as required under the DPDP Act 2023.",
      "Despite our best efforts, no system is 100% secure. We encourage you to use strong passwords and not share your account credentials.",
    ],
  },
  {
    icon: UserCheck,
    title: "5. Your Rights Under DPDP Act 2023",
    content: [
      "Right to Access: You may request a copy of all personal data we hold about you.",
      "Right to Correction: You may request correction of inaccurate or incomplete personal data.",
      "Right to Erasure: You may request deletion of your personal data, subject to legal retention obligations.",
      "Right to Grievance Redressal: You may file a complaint with our Data Protection Officer or the Data Protection Board of India.",
      "Right to Nominate: You may nominate another individual to exercise your rights in the event of your death or incapacity.",
      "To exercise any of these rights, contact our Data Protection Officer at privacy@kranti.org.in. We will respond within 30 days.",
    ],
  },
  {
    icon: Trash2,
    title: "6. Data Retention",
    content: [
      "Account data is retained for the duration of your account and for 3 years after account deletion for legal compliance purposes.",
      "Submitted content (issues, petitions, campaigns) is retained for 5 years to maintain public record integrity, even after account deletion.",
      "Evidence files are retained for 5 years or until the associated content is permanently deleted by a moderator.",
      "Moderation logs are retained for 3 years as required for transparency reporting.",
      "Usage logs are retained for 90 days for security purposes.",
    ],
  },
  {
    icon: ShieldAlert,
    title: "7. Sensitive Personal Data",
    content: [
      "Incident reports involving communal violence, caste discrimination, gender-based violence, or sexual harassment are treated as sensitive personal data.",
      "Such reports are visible only to authenticated users and moderators. They are never indexed by search engines.",
      "We apply additional access controls and audit logging to sensitive reports.",
      "Survivor information in reports is never publicly disclosed without explicit consent.",
      "We comply with the Protection of Children from Sexual Offences (POCSO) Act and will report any content involving minors to the appropriate authorities.",
    ],
  },
  {
    icon: Globe,
    title: "8. Cookies & Tracking",
    content: [
      "We use essential cookies for authentication (Clerk session cookies) and language preference (NEXT_LOCALE cookie).",
      "We do not use advertising cookies, third-party tracking pixels, or behavioural analytics tools.",
      "You can clear cookies at any time through your browser settings. Clearing authentication cookies will log you out.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Header */}
        <div className="space-y-4">
          <Badge variant="outline" className="border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-white/5">
            Legal Document
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            How Kranti collects, uses, and protects your personal data. Compliant with India&apos;s Digital Personal Data Protection Act 2023.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: May 2026 · Effective: May 2026 · Governed by Indian law (DPDP Act 2023, IT Act 2000)
          </p>
        </div>

        {/* Quick Summary */}
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-3">Plain-language summary</p>
          <ul className="space-y-1.5 text-sm text-emerald-900 dark:text-emerald-200">
            <li>✓ We collect only what is needed to run the platform</li>
            <li>✓ We never sell your data to advertisers or third parties</li>
            <li>✓ Sensitive reports are never publicly indexed</li>
            <li>✓ You can request deletion of your data at any time</li>
            <li>✓ We comply with India&apos;s DPDP Act 2023 and IT Rules 2021</li>
          </ul>
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

        {/* DPO Contact */}
        <Card className="border-blue-200/60 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-blue-900 dark:text-blue-200">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                <Mail className="h-4.5 w-4.5 text-blue-700 dark:text-blue-300" />
              </span>
              Data Protection Officer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-7 text-blue-800 dark:text-blue-300">
              For privacy concerns, data access requests, or to exercise your rights under the DPDP Act 2023, contact our Data Protection Officer:
            </p>
            <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>Email:</strong>{" "}
                <a href="mailto:privacy@kranti.org.in" className="underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300">
                  privacy@kranti.org.in
                </a>
              </p>
              <p><strong>Response time:</strong> Within 30 days of receipt</p>
              <p><strong>Organisation:</strong> Centre for Information Technology India, New Delhi</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          This Privacy Policy is subject to change. Material changes will be communicated via email or platform notification.
        </p>
      </div>
    </div>
  );
}
