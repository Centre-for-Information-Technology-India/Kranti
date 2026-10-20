"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Privacy review must be published before this build flag is enabled.
const enabled = process.env.NEXT_PUBLIC_KRANTI_ANALYTICS_ENABLED === "true";
const ingestUrl = "https://us.i.posthog.com/i/v0/e/";
const publicKey = "phc_qCsjAwv6sAiSsL7KkvcaR575Lh3fEgqr3eiSCfE3sGBy";
let anonymousVisitId: string | undefined;

const publicPages = new Set([
  "/", "/about", "/campaigns", "/create", "/donate", "/guidelines",
  "/guides", "/issues", "/offline", "/petitions", "/privacy",
  "/sign-in", "/sign-up", "/terms", "/transparency", "/volunteer",
]);

function publicPageName(pathname: string): string | null {
  if (publicPages.has(pathname)) return pathname;
  if (/^\/guides\/[^/]+$/.test(pathname)) return "/guides/[slug]";
  if (/^\/issues\/[^/]+$/.test(pathname)) return "/issues/[slug]";
  if (/^\/petitions\/[^/]+$/.test(pathname)) return "/petitions/[slug]";
  if (/^\/campaigns\/[^/]+$/.test(pathname)) return "/campaigns/[slug]";
  return null;
}

function capture(event: string, properties: Record<string, string>) {
  anonymousVisitId ??= crypto.randomUUID();
  // No cookie, session replay, autocapture, URL query, account, or case data.
  void fetch(ingestUrl, {
    method: "POST",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: publicKey,
      event,
      distinct_id: anonymousVisitId,
      properties: { ...properties, $process_person_profile: false, $geoip_disable: true },
    }),
  }).catch(() => {
    // Tracking must never stop a civic action.
  });
}

export function VisitorEvents() {
  const pathname = usePathname();
  const lastPage = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !pathname || lastPage.current === pathname) return;
    lastPage.current = pathname;
    const page = publicPageName(pathname);
    if (page) capture("$pageview", { page });
    if (pathname === "/sign-in") capture("sign_in_attempt", {});
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!link || !/^\/guides\/[^/]+$/.test(window.location.pathname)) return;
      const url = new URL(link.getAttribute("href") || "", window.location.origin);
      let action: string | null = null;
      if (url.origin === window.location.origin && url.pathname === "/issue/new") action = "raise_issue";
      else if (url.origin === window.location.origin && url.pathname === "/petition/new") action = "start_petition";
      else if (["rtionline.gov.in", "mcdonline.nic.in", "pgportal.gov.in"].includes(url.hostname)) action = "official_portal";
      if (action) capture("guide_action_click", { action });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
