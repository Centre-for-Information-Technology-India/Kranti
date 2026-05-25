"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, Phone, ExternalLink } from "lucide-react";

export function SiteFooter() {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-900/5 bg-white/60 px-6 py-10 dark:bg-slate-900/60 dark:border-white/5">
      <div className="mx-auto max-w-7xl">
        {/* Main footer grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {/* Brand */}
          <div className="space-y-3">
            <p className="text-base font-semibold text-slate-900 dark:text-white">Kranti</p>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              {t("description")}
            </p>
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t("tagline")}
            </p>
            <a
              href="https://github.com/Centre-for-Information-Technology-India/Kranti"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("license")}
            </a>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t("sections.platform")}
            </p>
            <nav className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Link href="/issues" className="hover:text-slate-900 dark:hover:text-white">{tCommon("issues")}</Link>
              <Link href="/petitions" className="hover:text-slate-900 dark:hover:text-white">{tCommon("petitions")}</Link>
              <Link href="/campaigns" className="hover:text-slate-900 dark:hover:text-white">{tCommon("campaigns")}</Link>
              <Link href="/create" className="hover:text-slate-900 dark:hover:text-white">{tCommon("create")}</Link>
              <Link href="/guides" className="hover:text-slate-900 dark:hover:text-white">{tCommon("guides")}</Link>
              <Link href="/transparency" className="hover:text-slate-900 dark:hover:text-white">{tCommon("transparency")}</Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t("sections.legal")}
            </p>
            <nav className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white">{t("links.terms")}</Link>
              <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white">{t("links.privacy")}</Link>
              <Link href="/moderation" className="hover:text-slate-900 dark:hover:text-white">{t("links.moderation")}</Link>
              <Link href="/guidelines" className="hover:text-slate-900 dark:hover:text-white">{t("links.guidelines")}</Link>
              <Link href="/about" className="hover:text-slate-900 dark:hover:text-white">{t("links.about")}</Link>
              <Link href="/volunteer" className="hover:text-slate-900 dark:hover:text-white font-medium text-emerald-600 dark:text-emerald-400">Volunteer / Donate</Link>
            </nav>
          </div>

          {/* Grievance Officer */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Grievance Officer
            </p>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p className="text-xs text-slate-500 dark:text-slate-500">As required under IT Rules 2021</p>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <a href="mailto:grievance@kranti.org.in" className="hover:text-slate-900 dark:hover:text-white">
                  grievance@kranti.org.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>+91-11-2456-0758</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Acknowledged in 24h · Resolved in 15 days
              </p>
              <a
                href="mailto:legal@kranti.org.in"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <Mail className="h-3 w-3" />
                legal@kranti.org.in
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-900/5 pt-6 dark:border-white/5">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("copyright", { year })}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t("developedBy")}{" "}
              <a
                href="https://www.cit.org.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline underline-offset-2 inline-flex items-center gap-0.5"
              >
                {t("organization")}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
