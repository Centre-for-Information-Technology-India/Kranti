export class RequestBodyTooLargeError extends Error {}

export async function readJsonWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null && Number(declaredLength) > maxBytes) {
    throw new RequestBodyTooLargeError("Request body is too large");
  }

  if (!request.body) return JSON.parse("");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError("Request body is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
}
