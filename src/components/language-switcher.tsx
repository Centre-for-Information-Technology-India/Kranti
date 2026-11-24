"use client";

import { useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function getLocaleCookie(): "en" | "hi" {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match?.[1] === "hi" ? "hi" : "en";
}

function subscribeLocale(onChange: () => void) {
  window.addEventListener("kranti-locale-change", onChange);
  return () => window.removeEventListener("kranti-locale-change", onChange);
}

export function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const locale = useSyncExternalStore(subscribeLocale, getLocaleCookie, () => "en");

  const switchLanguage = () => {
    const next = locale === "en" ? "hi" : "en";

    // 1. Write cookie with a 1-year expiry, strict same-site
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Strict`;

    // 2. Update local state immediately so button label flips right away
    window.dispatchEvent(new Event("kranti-locale-change"));

    // 3. Use router.refresh() — this re-runs all Server Components on the
    //    current page (including the root layout) so next-intl picks up the
    //    new cookie without a full browser reload.
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLanguage}
      disabled={isPending}
      className="flex items-center gap-1.5"
      title={locale === "en" ? "हिन्दी में बदलें" : "Switch to English"}
      aria-label={locale === "en" ? "Switch to Hindi" : "Switch to English"}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Globe className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">
        {locale === "en" ? "हिन्दी" : "English"}
      </span>
    </Button>
  );
}
