import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("non-public petition details stay out of page metadata and structured data", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";

  try {
    let status = "pending_review";
    globalThis.fetch = async () => Response.json({ documents: [{
      $id: "synthetic_petition",
      slug: "synthetic-petition",
      title: "Synthetic private title",
      description: "Synthetic private description",
      status,
    }] });

    const { default: PetitionDetailLayout, generateMetadata } = await import("./layout");
    const params = Promise.resolve({ slug: "synthetic-petition" });
    const pendingMetadata = await generateMetadata({ params });
    const pendingLayout = await PetitionDetailLayout({ params, children: createElement("span", null, "Page child") });
    const pendingMarkup = renderToStaticMarkup(pendingLayout);

    assert.equal(pendingMetadata.title, "Petition not found");
    assert.deepEqual(pendingMetadata.robots, { index: false, follow: false });
    assert.equal(pendingMarkup, "<span>Page child</span>");
    assert.doesNotMatch(pendingMarkup, /Synthetic private/);

    for (const hiddenStatus of ["rejected", "withdrawn", "unexpected"]) {
      status = hiddenStatus;
      const hiddenMetadata = await generateMetadata({ params });
      const hiddenLayout = await PetitionDetailLayout({ params, children: createElement("span", null, "Page child") });
      const hiddenMarkup = renderToStaticMarkup(hiddenLayout);
      assert.equal(hiddenMetadata.title, "Petition not found");
      assert.equal(hiddenMarkup, "<span>Page child</span>");
      assert.doesNotMatch(hiddenMarkup, /Synthetic private/);
    }

    status = "open";
    const openLayout = await PetitionDetailLayout({ params, children: createElement("span", null, "Page child") });
    const openMarkup = renderToStaticMarkup(openLayout);
    assert.match(openMarkup, /Synthetic private title/);
    assert.match(openMarkup, /application\/ld\+json/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
