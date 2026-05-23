import type { Metadata } from "next";

// Force the root layout to always be dynamic so the NEXT_LOCALE cookie
// is re-read on every request (required for language switching to work).
export const dynamic = "force-dynamic";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
import { PWARegister } from "@/components/pwa-register";
import AppwriteSync from "@/components/appwrite-sync";
import { CockroachPointer } from "@/components/cockroach-pointer";
import { VisitAudio } from "@/components/visit-audio";
import { JsonLd } from "@/components/json-ld";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
} from "@/lib/seo";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — People First Civic Action in India`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  authors: [{ name: "Centre for Information Technology India", url: "https://www.cit.org.in" }],
  creator: "Centre for Information Technology India",
  publisher: "Centre for Information Technology India",
  keywords: [
    "Kranti",
    "civic action India",
    "raise civic issue India",
    "online petition India",
    "RTI India",
    "FIR India",
    "consumer complaint India",
    "CPGRAMS grievance",
    "public accountability",
    "citizen voice India",
    "civic platform India",
    "जनता की आवाज",
    "नागरिक अधिकार",
  ],
  category: "civic technology",
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/",
      "hi-IN": "/",
      "x-default": "/",
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["hi_IN"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — People First Civic Action in India`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — People First Civic Action`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@krantiorgin",
    creator: "@krantiorgin",
    title: `${SITE_NAME} — People First Civic Action in India`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  verification: {
    // Fill these when domain is verified with each search console:
    // google: "google-site-verification=...",
    // yandex: "...",
    // other: { "msvalidate.01": "..." },
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  // Read locale from cookie to set the correct lang attribute
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";

  return (
    <html
      lang={locale}
      className={`${outfit.variable} ${jakarta.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kranti" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <JsonLd data={ORGANIZATION_SCHEMA} />
        <JsonLd data={WEBSITE_SCHEMA} />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-background text-foreground">
        <ClerkProvider>
          <NextIntlClientProvider messages={messages}>
            <PWARegister />
            <AppwriteSync />
            <CockroachPointer />
            <VisitAudio />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
