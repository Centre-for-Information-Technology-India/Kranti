"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Target, Loader2, Share2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignRecord } from "@/lib/content-types";
import { campaignCategories } from "@/lib/campaign-form";

const statusColors = {
  pending_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  paused: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

export default function CampaignDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${slug}`);
      if (!response.ok) throw new Error("Campaign not found");
      const data = await response.json();
      setCampaign(data.campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchCampaign();
    }
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: campaign?.title,
        text: campaign?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] dark:bg-slate-950">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Campaign not found</CardTitle>
            <CardDescription>The campaign you're looking for doesn't exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const categoryLabel = campaignCategories.find((c) => c.value === campaign.category)?.label || campaign.category;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f1ea] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-900/20" />
        <div className="absolute right-0 top-20 h-96 w-96 translate-x-1/3 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-900/20" />
      </div>

      <main className="relative mx-auto max-w-5xl px-6 pb-14 pt-14 lg:px-8 lg:pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusColors[campaign.status]}>
                {campaign.status.replace("_", " ")}
              </Badge>
              <Badge variant="secondary">{categoryLabel}</Badge>
              {campaign.featured && (
                <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300">
                  Featured
                </Badge>
              )}
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{campaign.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{campaign.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{campaign.volunteer_count} volunteers</span>
              </div>
              {campaign.start_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Started {new Date(campaign.start_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={campaign.creatorAvatar} alt={campaign.creatorName} />
                <AvatarFallback>{campaign.creatorName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{campaign.creatorName}</p>
                <p className="text-xs text-slate-500">
                  Created {new Date(campaign.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <Card className="border-slate-900/10 bg-white/85 shadow-lg dark:border-white/10 dark:bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-2xl">About this Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-900/10 bg-white/85 shadow-lg dark:border-white/10 dark:bg-slate-900/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="h-6 w-6" />
                Campaign Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed">{campaign.goals}</p>
              </div>
            </CardContent>
          </Card>

          {campaign.end_date && (
            <Card className="border-slate-900/10 bg-white/85 shadow-lg dark:border-white/10 dark:bg-slate-900/40">
              <CardHeader>
                <CardTitle className="text-xl">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {campaign.start_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Start Date:</span>
                    <span className="font-medium">{new Date(campaign.start_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Target End Date:</span>
                  <span className="font-medium">{new Date(campaign.end_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-900/10 bg-white/85 shadow-lg dark:border-white/10 dark:bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-xl">Get Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Join {campaign.volunteer_count} volunteers working towards this campaign's goals. Share this campaign to spread awareness and build support.
              </p>
              <div className="flex gap-3">
                <Button className="flex-1" disabled>
                  <Users className="mr-2 h-4 w-4" />
                  Volunteer (Coming Soon)
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="my-8 h-px bg-slate-900/10 dark:bg-white/10" />

          <Card className="border-slate-900/10 bg-white/70 shadow-sm dark:border-white/10 dark:bg-slate-900/30">
            <CardHeader>
              <CardTitle className="text-xl">Campaign Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                This campaign is part of Kranti's civic action platform. All campaigns are moderated to ensure they promote lawful, evidence-based action.
              </p>
              <p>
                If you notice any issues with this campaign, please report it to our moderation team.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
