import assert from "node:assert/strict";
import test from "node:test";

test("petition increments use Appwrite's atomic document endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "test-key";
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  };

  try {
    const { incrementDocumentAttribute } = await import("./appwrite");
    await Promise.all([
      incrementDocumentAttribute("kranti", "petitions", "petition-one", "signature_count"),
      incrementDocumentAttribute("kranti", "petitions", "petition-one", "signature_count"),
    ]);
    assert.equal(calls.length, 2);
    for (const { url, init } of calls) {
      assert.match(url, /\/databases\/kranti\/collections\/petitions\/documents\/petition-one\/signature_count\/increment$/);
      assert.equal(init.method, "PATCH");
      assert.equal(init.body, JSON.stringify({ value: 1 }));
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
