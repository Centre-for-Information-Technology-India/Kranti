import { appwriteDatabaseId, listDocuments, Query } from "@/lib/appwrite";

type Document = Record<string, unknown>;
type List = (databaseId: string, collectionId: string, queries: string[]) => Promise<unknown>;

const PAGE_SIZE = 100;

async function allPages(collectionId: string, filters: string[], list: List, stage: string): Promise<Document[]> {
  const documents: Document[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let response: unknown;
    try {
      response = await list(appwriteDatabaseId, collectionId, [...filters, Query.limit(PAGE_SIZE), Query.offset(offset)]);
    } catch (error) {
      console.error(`Dashboard ${stage} read failed at offset ${offset}`);
      throw error;
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
  caseKind = "case",
): Promise<Document[]> {
  const [owned, participation] = await Promise.all([
    allPages(collectionId, [Query.equal("created_by", [userId])], list, `${caseKind} owned`),
    allPages(participationCollectionId, [Query.equal("user_id", [userId])], list, `${caseKind} participation`),
  ]);

  const ownedIds = new Set(owned.map((document) => String(document.$id)));
  const joinedIds = [...new Set(participation.map((document) => String(document[participationCaseField] ?? "")))]
    .filter((id) => id && !ownedIds.has(id));
  const joined = (await Promise.all(Array.from({ length: Math.ceil(joinedIds.length / 50) }, (_, index) => {
    const ids = joinedIds.slice(index * 50, (index + 1) * 50);
    return list(appwriteDatabaseId, collectionId, [Query.equal("$id", ids), Query.limit(50)])
      .catch((error) => {
        console.error(`Dashboard ${caseKind} joined read failed at batch ${index}`);
        throw error;
      });
  }))).flatMap((response) => (response as { documents?: Document[] }).documents ?? []);

  return [...owned, ...joined].sort((a, b) =>
    String(b.created_at ?? b.$createdAt ?? "").localeCompare(String(a.created_at ?? a.$createdAt ?? ""))
  );
}
