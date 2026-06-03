"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ShieldCheck } from "lucide-react";

export function DonationCard() {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current && formRef.current.children.length === 0) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/payment-button.js";
      script.setAttribute("data-payment_button_id", "pl_StaqcnJWBBj2J6");
      script.async = true;
      formRef.current.appendChild(script);
    }
  }, []);

  return (
    <Card className="border-slate-900/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <CardTitle className="text-xl">Support Kranti</CardTitle>
        </div>
        <CardDescription>
          Help us build responsible civic infrastructure for India.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Every contribution goes towards:
        </p>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Server & hosting costs
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Moderation tools
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Legal compliance
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Guides & education content
          </li>
        </ul>
        <div className="pt-2">
          <form ref={formRef} className="min-h-[48px]" />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 border-t border-slate-900/5 dark:border-white/5 pt-4">
          <strong>100% Transparent</strong> &mdash; We publish monthly funding & expense reports.
        </p>
      </CardContent>
    </Card>
  );
}