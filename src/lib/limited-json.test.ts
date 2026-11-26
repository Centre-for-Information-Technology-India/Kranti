import assert from "node:assert/strict";
import test from "node:test";

import { readJsonWithLimit, RequestBodyTooLargeError } from "./limited-json";

test("accepts a JSON body at the byte limit", async () => {
  const body = '{"message":"ok"}';
  const request = new Request("https://example.test", { method: "POST", body });
  assert.deepEqual(await readJsonWithLimit(request, Buffer.byteLength(body)), { message: "ok" });
});

test("rejects a streamed body when it exceeds the limit", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"message":"'));
        controller.enqueue(new TextEncoder().encode("x".repeat(20)));
        controller.close();
      },
    }),
    duplex: "half",
  } as RequestInit);
  await assert.rejects(readJsonWithLimit(request, 16), RequestBodyTooLargeError);
});

test("rejects an oversized declared length before reading", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    headers: { "content-length": "20" },
    body: "{}",
  });
  await assert.rejects(readJsonWithLimit(request, 16), RequestBodyTooLargeError);
});

test("reports malformed JSON separately from an oversized body", async () => {
  const request = new Request("https://example.test", { method: "POST", body: "{" });
  await assert.rejects(readJsonWithLimit(request, 16), SyntaxError);
});
