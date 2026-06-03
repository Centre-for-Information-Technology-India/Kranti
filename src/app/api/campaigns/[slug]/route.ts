import { NextRequest, NextResponse } from "next/server";
import { listDocuments, appwriteDatabaseId, appwriteCampaignsCollectionId } from "@/lib/appwrite";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const response = await listDocuments(appwriteDatabaseId, appwriteCampaignsCollectionId, [
      `equal("slug", ["${slug}"])`,
      `limit(1)`,
    ]);

    if (!(response as { documents?: Array<Record<string, unknown>> }).documents || ((response as { documents?: Array<Record<string, unknown>> }).documents ?? []).length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const doc = ((response as { documents?: Array<Record<string, unknown>> }).documents ?? [])[0] as Record<string, unknown>;

    const campaign = {
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
    };

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Campaign fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}
