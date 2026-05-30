import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ActivateClient } from "./ActivateClient";

export const dynamic = "force-dynamic";

export default function ActivatePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showApiKey={false} />
      <main className="flex-1 container py-12 sm:py-20">
        <React.Suspense
          fallback={
            <div className="py-16 text-center text-muted-foreground">
              Memuat...
            </div>
          }
        >
          <ActivateClient />
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
}
