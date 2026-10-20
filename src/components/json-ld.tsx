/**
 * Renders a <script type="application/ld+json"> tag with the provided schema.
 * Server component — emits inline JSON-LD for search engines.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
