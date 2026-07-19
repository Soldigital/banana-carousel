import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ResetPasswordClient } from "./ResetPasswordClient";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showApiKey={false} />
      <main className="flex-1 container py-12 sm:py-20">
        <React.Suspense
          fallback={
            <div className="py-16 text-center text-muted-foreground">Memuat...</div>
          }
        >
          <ResetPasswordClient />
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
}
