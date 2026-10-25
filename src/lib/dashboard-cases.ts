import { appwriteDatabaseId, listDocuments, Query } from "@/lib/appwrite";

type Document = Record<string, unknown>;
type List = (databaseId: string, collectionId: string, queries: string[]) => Promise<unknown>;

const PAGE_SIZE = 100;

export type DashboardReadStage = "issue_owned" | "issue_participation" | "issue_joined" | "petition_owned" | "petition_participation" | "petition_joined";

export class DashboardReadError extends Error {
  constructor(readonly stage: DashboardReadStage) {
    super("Dashboard case read failed");
  }
}

async function allPages(collectionId: string, filters: string[], list: List, stage: DashboardReadStage): Promise<Document[]> {
  const documents: Document[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let response: unknown;
    try {
      response = await list(appwriteDatabaseId, collectionId, [...filters, Query.limit(PAGE_SIZE), Query.offset(offset)]);
    } catch {
      console.error(`Dashboard ${stage} read failed at offset ${offset}`);
      throw new DashboardReadError(stage);
    }
    const page = (response as { documents?: Document[] }).documents ?? [];
    documents.push(...page);
    if (page.length < PAGE_SIZE) return documents;
  }
}

export async function dashboardCasesForUser(
  collectionId: string,
  participationCollectionId: string,
  participationCaseField: string,
  userId: string,
  list: List = listDocuments,
  caseKind: "issue" | "petition" = "issue",
): Promise<Document[]> {
  const stageKind = caseKind;
  const [owned, participation] = await Promise.all([
    allPages(collectionId, [Query.equal("created_by", [userId])], list, `${stageKind}_owned`),
    allPages(participationCollectionId, [Query.equal("user_id", [userId])], list, `${stageKind}_participation`),
  ]);

  const ownedIds = new Set(owned.map((document) => String(document.$id)));
  const joinedIds = [...new Set(participation.map((document) => String(document[participationCaseField] ?? "")))]
    .filter((id) => id && !ownedIds.has(id));
  const joined = (await Promise.all(Array.from({ length: Math.ceil(joinedIds.length / 50) }, (_, index) => {
    const ids = joinedIds.slice(index * 50, (index + 1) * 50);
    return list(appwriteDatabaseId, collectionId, [Query.equal("$id", ids), Query.limit(50)])
      .catch(() => {
        console.error(`Dashboard ${caseKind} joined read failed at batch ${index}`);
        throw new DashboardReadError(`${stageKind}_joined`);
      });
  }))).flatMap((response) => (response as { documents?: Document[] }).documents ?? []);

  return [...owned, ...joined].sort((a, b) =>
    String(b.created_at ?? b.$createdAt ?? "").localeCompare(String(a.created_at ?? a.$createdAt ?? ""))
  );
}
