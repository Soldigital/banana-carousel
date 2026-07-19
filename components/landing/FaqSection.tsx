import { FAQ_ITEMS } from "@/lib/seo/structured-data";

// Visible FAQ — backs the FAQPage JSON-LD (Google wants the answer text on the
// page) and doubles as AI-crawler-friendly Q&A content.
export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto max-w-3xl px-4 py-20"
    >
      <header className="mb-10 text-center">
        <h2
          id="faq-heading"
          className="font-display text-3xl font-bold sm:text-4xl"
        >
          Pertanyaan Umum
        </h2>
        <p className="mt-3 text-muted-foreground">
          Hal yang sering ditanyakan tentang Banana Carousel.
        </p>
      </header>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-border bg-card/40 p-5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold">
              {item.question}
              <span className="text-banana transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
