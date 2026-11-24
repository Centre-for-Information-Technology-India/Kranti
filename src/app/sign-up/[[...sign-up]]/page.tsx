import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Join Kranti",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}

export default async function SignUpPage({ searchParams }: Props) {
  const { redirect_url } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] px-6 py-12 dark:bg-slate-950">
      <div className="flex w-full flex-col items-center gap-5">
        <SignUp
          path="/sign-up"
          routing="path"
          forceRedirectUrl={safeAuthRedirect(redirect_url)}
          fallbackRedirectUrl="/dashboard"
        />
        <p className="text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
          Read our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-slate-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 dark:hover:text-white dark:focus-visible:outline-white">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-950 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 dark:hover:text-white dark:focus-visible:outline-white">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
