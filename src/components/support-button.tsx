"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";

type SupportButtonProps = {
  slug: string;
  initialSupportCount: number;
};

export function SupportButton({ slug, initialSupportCount }: SupportButtonProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [supportCount, setSupportCount] = useState(initialSupportCount);
  const [isSupporting, setIsSupporting] = useState(false);
  const [hasSupported, setHasSupported] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  async function handleSupport() {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setIsSupporting(true);
    setFeedback(null);
    setHasError(false);
    try {
      const response = await fetch(`/api/issues/${slug}/support`, { method: "POST" });
      const body = (await response.json()) as {
        error?: string;
        supportCount?: number;
        countUpdated?: boolean;
        alreadySupported?: boolean;
      };

      if (!response.ok) {
        throw new Error(body.error || "Failed to support the issue.");
      }

      if (typeof body.supportCount === "number") setSupportCount(body.supportCount);
      setHasSupported(true);
      setFeedback(body.countUpdated === false && !body.alreadySupported
        ? "Your support was saved. The public count may update later."
        : "Your support was saved.");
      if (body.countUpdated !== false) router.refresh();
    } catch (error) {
      console.error(error);
      setHasError(true);
      setFeedback("We could not confirm your support. Please try again.");
    } finally {
      setIsSupporting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={handleSupport}
        disabled={!isLoaded || isSupporting || hasSupported}
        aria-pressed={hasSupported}
        className="rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
      >
        <Heart className="mr-1.5 h-4 w-4" />
        {hasSupported ? "Supported" : "Support"} ({supportCount})
      </Button>
      {feedback && (
        <p role={hasError ? "alert" : "status"} className={`max-w-xs text-sm ${hasError ? "text-rose-700 dark:text-rose-300" : "text-slate-600 dark:text-slate-300"}`}>
          {feedback}
        </p>
      )}
    </div>
  );
}
