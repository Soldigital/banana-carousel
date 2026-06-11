"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CHICHI_EXAMPLES,
  OTHER_EXAMPLES,
  CHICHI_TIKTOK_URL,
  type ExampleImage,
} from "@/lib/data/examples";

function PosterCarousel({ images }: { images: ExampleImage[] }) {
  const ref = React.useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.min(el.clientWidth * 0.9, 600),
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img) => (
          <div key={img.src} className="snap-start shrink-0 w-44 sm:w-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              decoding="async"
              width={1080}
              height={1350}
              style={{ aspectRatio: "4 / 5" }}
              className="w-full h-auto rounded-2xl border border-border bg-card shadow-sm"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Sebelumnya"
        onClick={() => scroll(-1)}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 size-10 items-center justify-center rounded-full border border-border bg-background/90 shadow-md backdrop-blur hover:bg-secondary"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Berikutnya"
        onClick={() => scroll(1)}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-10 items-center justify-center rounded-full border border-border bg-background/90 shadow-md backdrop-blur hover:bg-secondary"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

export function ExampleGallery() {
  // Hidden until at least one example image exists (populated by the
  // compress-examples script). Keeps the page clean pre-content.
  if (CHICHI_EXAMPLES.length === 0 && OTHER_EXAMPLES.length === 0) return null;

  return (
    <section className="container py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
        <p className="text-xs font-bold tracking-[0.2em] text-banana">
          CONTOH HASIL
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Poster nyata yang dibuat dengan Banana Carousel.
        </h2>
      </div>

      {CHICHI_EXAMPLES.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 max-w-5xl mx-auto"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-display font-bold text-lg sm:text-xl">
              @chichi.kelinci
            </h3>
            <Button asChild variant="outline" size="sm">
              <a
                href={CHICHI_TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Music2 className="size-4" />
                Lihat di TikTok
              </a>
            </Button>
          </div>
          <PosterCarousel images={CHICHI_EXAMPLES} />
        </motion.div>
      )}

      {OTHER_EXAMPLES.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-5xl mx-auto"
        >
          <h3 className="font-display font-bold text-lg sm:text-xl mb-4">
            Contoh Hasil Lainnya
          </h3>
          <PosterCarousel images={OTHER_EXAMPLES} />
        </motion.div>
      )}
    </section>
  );
}
