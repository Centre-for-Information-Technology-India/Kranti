import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { ID } from "node-appwrite";

import {
  appwriteDatabaseId,
  appwriteCampaignsCollectionId,
  createDocument,
  listDocuments,
  Query,
} from "@/lib/appwrite";
import { campaignFormSchema } from "@/lib/campaign-form";
import { buildCampaignSlug } from "@/lib/campaign-slug";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = campaignFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the campaign details and try again." }, { status: 400 });
    }
    const validatedData = parsed.data;

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "Anonymous";
    const userAvatar = user.imageUrl;

    const campaignId = ID.unique();
    const slug = buildCampaignSlug(validatedData.title, campaignId);

    const campaignData = {
      title: validatedData.title,
      slug,
      description: validatedData.description,
      goals: validatedData.goals,
      category: validatedData.category,
      state: validatedData.state,
      status: "pending_review",
      volunteer_count: 0,
      featured: false,
      created_by: userId,
      creator_name: userName,
      creator_avatar: userAvatar || "",
      language: validatedData.language,
      start_date: validatedData.startDate || null,
      end_date: validatedData.endDate || null,
      created_at: new Date().toISOString(),
    };

    await createDocument(appwriteDatabaseId, appwriteCampaignsCollectionId, campaignId, campaignData);

    return NextResponse.json({
      success: true,
      campaignId,
      slug,
    });
  } catch (error) {
    console.error("Campaign creation error:", error);

    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const state = searchParams.get("state");
    const status = searchParams.get("status");
    const featured = searchParams.get("featured");

    const queries: string[] = [];

    if (category) {
      queries.push(Query.equal("category", [category]));
    }

    if (state) {
      queries.push(Query.equal("state", [state]));
    }

    if (status) {
      queries.push(Query.equal("status", [status]));
    } else {
      queries.push(`notEqual("status", ["pending_review"])`);
    }

    if (featured === "true") {
      queries.push(Query.equal("featured", [true]));
    }

    queries.push(Query.orderDesc("created_at"));
    queries.push(Query.limit(100));

    const response = await listDocuments(appwriteDatabaseId, appwriteCampaignsCollectionId, queries);

    const campaigns = ((response as { documents?: Array<Record<string, unknown>> }).documents ?? []).map((doc: Record<string, unknown>) => ({
      $id: doc.$id,
      title: doc.title,
      slug: doc.slug,
      description: doc.description,
      goals: doc.goals,
      category: doc.category,
      state: doc.state,
      status: doc.status,
      volunteer_count: doc.volunteer_count,
      featured: doc.featured,
      created_by: doc.created_by,
      creatorName: doc.creator_name,
      creatorAvatar: doc.creator_avatar,
      language: doc.language,
      start_date: doc.start_date,
      end_date: doc.end_date,
      createdAt: doc.created_at,
    }));

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Campaigns fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}
