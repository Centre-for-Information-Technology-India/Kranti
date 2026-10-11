"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function IssueDetailError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f4f1ea] px-6 py-12 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-900/10 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
        <AlertCircle aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-slate-700 dark:text-slate-200" />
        <h1 className="text-2xl font-semibold">Issue could not load</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Your issue link may still work. Please try again.
        </p>
        <div className="mt-6 flex flex-col items-center gap-4">
          <Button onClick={() => unstable_retry()} className="min-h-11 bg-slate-900 px-6 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
            Try again
          </Button>
          <Link href="/issues" className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
            View issues
          </Link>
        </div>
      </div>
    </main>
  );
}
