// Renders a JSON-LD <script>. Safe in both server and client components.
// Content is our own static/derived data — not user input — so dangerouslySet
// is appropriate here.
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
