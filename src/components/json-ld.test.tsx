import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { JsonLd } from "./json-ld";

test("citizen text cannot close a JSON-LD script", () => {
  const title = '</script><script>alert("unsafe")</script>';
  const data = { "@context": "https://schema.org", headline: title, nested: { text: "<b>detail</b>" } };
  const html = renderToStaticMarkup(<JsonLd data={data} />);

  assert.equal((html.match(/<script/g) ?? []).length, 1);
  assert.equal((html.match(/<\/script>/g) ?? []).length, 1);
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes("\\u003c/script>"));

  const payload = html.slice(html.indexOf(">") + 1, html.lastIndexOf("</script>"));
  assert.deepEqual(JSON.parse(payload), data);
});
