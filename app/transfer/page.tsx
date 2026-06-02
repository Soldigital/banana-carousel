import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { TransferClient } from "./TransferClient";

export const dynamic = "force-dynamic";

// Public ("Beli = Daftar") — no login required.
export default function TransferPage() {
  if (!hasSupabaseEnv()) redirect("/");

  return (
    <div className="min-h-screen flex flex-col">
      <Header showApiKey={false} />
      <main className="flex-1 container py-10 sm:py-14">
        <TransferClient />
      </main>
      <Footer />
    </div>
  );
}
