import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { safeAuthRedirect } from "@/lib/auth-redirect";

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
      <SignUp
        path="/sign-up"
        routing="path"
        forceRedirectUrl={safeAuthRedirect(redirect_url)}
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
