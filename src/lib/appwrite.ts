type AppwriteJson = Record<string, unknown>;

const appwriteEndpoint = process.env.APPWRITE_ENDPOINT ?? "https://citorg.in/v1";
const appwriteProjectId = process.env.APPWRITE_PROJECT_ID ?? "kranti";
const appwriteApiKey = process.env.APPWRITE_API_KEY;

export const appwriteDatabaseId = process.env.APPWRITE_DATABASE_ID ?? "kranti";
export const appwriteUsersCollectionId = process.env.APPWRITE_USERS_COLLECTION_ID ?? "users";
export const appwriteIssuesCollectionId = process.env.APPWRITE_ISSUES_COLLECTION_ID ?? "issues";
export const appwritePetitionsCollectionId = process.env.APPWRITE_PETITIONS_COLLECTION_ID ?? "petitions";
export const appwriteReportsCollectionId = process.env.APPWRITE_REPORTS_COLLECTION_ID ?? "reports";
export const appwriteCampaignsCollectionId = process.env.APPWRITE_CAMPAIGNS_COLLECTION_ID ?? "campaigns";
export const appwriteNotificationsCollectionId = process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID ?? "notifications";
export const appwriteSignaturesCollectionId = process.env.APPWRITE_SIGNATURES_COLLECTION_ID ?? "signatures";
export const appwriteEvidenceCollectionId = process.env.APPWRITE_EVIDENCE_COLLECTION_ID ?? "evidence";
export const appwriteSupportsCollectionId = process.env.APPWRITE_SUPPORTS_COLLECTION_ID ?? "supports";
export const appwriteCommentsCollectionId = process.env.APPWRITE_COMMENTS_COLLECTION_ID ?? "comments";
export const appwriteModerationLogsCollectionId = process.env.APPWRITE_MODERATION_LOGS_COLLECTION_ID ?? "moderation_logs";
export const appwriteStorageBucketId = process.env.APPWRITE_STORAGE_BUCKET_ID ?? "evidence-files";

function requireApiKey() {
  if (!appwriteApiKey) {
    throw new Error("APPWRITE_API_KEY is not configured.");
  }
}

async function appwriteRequest(path: string, init: RequestInit = {}) {
  requireApiKey();

  const response = await fetch(`${appwriteEndpoint}${path}`, {
    ...init,
    headers: {
      "X-Appwrite-Project": appwriteProjectId,
      "X-Appwrite-Key": appwriteApiKey as string,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body ? String((body as { message?: unknown }).message) : response.statusText;
    throw new Error(message || `Appwrite request failed (${response.status})`);
  }

  return body;
}

export async function createDocument(databaseId: string, collectionId: string, documentId: string, data: AppwriteJson) {
  return appwriteRequest(`/databases/${databaseId}/collections/${collectionId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId, data }),
  });
}

export async function updateDocument(databaseId: string, collectionId: string, documentId: string, data: AppwriteJson) {
  return appwriteRequest(`/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
}

export async function upsertDocument(databaseId: string, collectionId: string, documentId: string, data: AppwriteJson) {
  try {
    return await createDocument(databaseId, collectionId, documentId, data);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.toLowerCase().includes("already exists")) {
      throw error;
    }

    return updateDocument(databaseId, collectionId, documentId, data);
  }
}

export async function getDocument(databaseId: string, collectionId: string, documentId: string) {
  return appwriteRequest(`/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`);
}

export async function listDocuments(databaseId: string, collectionId: string, queries: string[] = []) {
  const normalizedQueries = queries.map(normalizeQuery);
  const queryString = normalizedQueries.map((query) => `queries[]=${encodeURIComponent(query)}`).join("&");
  const path = `/databases/${databaseId}/collections/${collectionId}/documents${queryString ? `?${queryString}` : ""}`;

  return appwriteRequest(path);
}

/**
 * Converts old-style string queries like `equal("field", ["value"])` or `orderDesc("field")`
 * to Appwrite 1.9+ JSON format. If already JSON, returns as-is.
 */
function normalizeQuery(query: string): string {
  // Already JSON format
  if (query.startsWith("{")) return query;

  // Match: methodName("attribute", ["value1", "value2"])
  const equalMatch = query.match(/^(equal|notEqual|lessThan|greaterThan|contains)\("([^"]+)",\s*\[(.*)\]\)$/);
  if (equalMatch) {
    const [, method, attribute, valuesStr] = equalMatch;
    const values = valuesStr.split(",").map((v) => {
      const trimmed = v.trim().replace(/^"|"$/g, "");
      const num = Number(trimmed);
      return isNaN(num) ? trimmed : num;
    });
    return JSON.stringify({ method, attribute, values });
  }

  // Match: orderDesc("attribute") or orderAsc("attribute")
  const orderMatch = query.match(/^(orderDesc|orderAsc)\("([^"]+)"\)$/);
  if (orderMatch) {
    const [, method, attribute] = orderMatch;
    return JSON.stringify({ method, attribute });
  }

  // Match: limit(N) or offset(N)
  const limitMatch = query.match(/^(limit|offset)\((\d+)\)$/);
  if (limitMatch) {
    const [, method, value] = limitMatch;
    return JSON.stringify({ method, values: [Number(value)] });
  }

  // Fallback: return as-is (may fail)
  return query;
}

/**
 * Query helpers for Appwrite 1.9+ JSON query format.
 */
export const Query = {
  equal: (attribute: string, values: (string | number | boolean)[]) =>
    JSON.stringify({ method: "equal", attribute, values }),
  limit: (count: number) =>
    JSON.stringify({ method: "limit", values: [count] }),
  orderDesc: (attribute: string) =>
    JSON.stringify({ method: "orderDesc", attribute }),
  orderAsc: (attribute: string) =>
    JSON.stringify({ method: "orderAsc", attribute }),
  offset: (count: number) =>
    JSON.stringify({ method: "offset", values: [count] }),
};

export async function deleteDocument(databaseId: string, collectionId: string, documentId: string) {
  return appwriteRequest(`/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`, {
    method: "DELETE",
  });
}

export async function uploadFile(bucketId: string, fileId: string, file: File) {
  const formData = new FormData();
  formData.append("fileId", fileId);
  formData.append("file", file, file.name);

  return appwriteRequest(`/storage/buckets/${bucketId}/files`, {
    method: "POST",
    body: formData,
  });
}

export async function uploadFileBuffer(bucketId: string, fileId: string, fileName: string, buffer: Buffer, mimeType: string) {
  const formData = new FormData();
  formData.append("fileId", fileId);
  formData.append("file", new File([new Uint8Array(buffer)], fileName, { type: mimeType }), fileName);

  return appwriteRequest(`/storage/buckets/${bucketId}/files`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteFile(bucketId: string, fileId: string) {
  return appwriteRequest(`/storage/buckets/${bucketId}/files/${fileId}`, {
    method: "DELETE",
  });
}

export async function downloadFile(bucketId: string, fileId: string) {
  requireApiKey();

  const response = await fetch(`${appwriteEndpoint}/storage/buckets/${bucketId}/files/${fileId}/download`, {
    headers: {
      "X-Appwrite-Project": appwriteProjectId,
      "X-Appwrite-Key": appwriteApiKey as string,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Appwrite download failed (${response.status})`);
  }

  return response.arrayBuffer();
}

export function getFileViewUrl(bucketId: string, fileId: string) {
  return `${appwriteEndpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${appwriteProjectId}`;
}
