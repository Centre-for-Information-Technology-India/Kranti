import { appwriteDatabaseId, listDocuments, Query } from "@/lib/appwrite";

type Document = Record<string, unknown>;
type List = (databaseId: string, collectionId: string, queries: string[]) => Promise<unknown>;

const PAGE_SIZE = 100;

async function allPages(collectionId: string, filters: string[], list: List): Promise<Document[]> {
  const documents: Document[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await list(appwriteDatabaseId, collectionId, [...filters, Query.limit(PAGE_SIZE), Query.offset(offset)]);
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
): Promise<Document[]> {
  const [owned, participation] = await Promise.all([
    allPages(collectionId, [Query.equal("created_by", [userId])], list),
    allPages(participationCollectionId, [Query.equal("user_id", [userId])], list),
  ]);

  const ownedIds = new Set(owned.map((document) => String(document.$id)));
  const joinedIds = [...new Set(participation.map((document) => String(document[participationCaseField] ?? "")))]
    .filter((id) => id && !ownedIds.has(id));
  const joined = (await Promise.all(Array.from({ length: Math.ceil(joinedIds.length / 50) }, (_, index) => {
    const ids = joinedIds.slice(index * 50, (index + 1) * 50);
    return list(appwriteDatabaseId, collectionId, [Query.equal("$id", ids), Query.limit(50)]);
  }))).flatMap((response) => (response as { documents?: Document[] }).documents ?? []);

  return [...owned, ...joined].sort((a, b) =>
    String(b.created_at ?? b.$createdAt ?? "").localeCompare(String(a.created_at ?? a.$createdAt ?? ""))
  );
}
