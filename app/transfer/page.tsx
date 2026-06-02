import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { TransferClient } from "./TransferClient";

export const dynamic = "force-dynamic";

export default async function TransferPage() {
  if (!hasSupabaseEnv()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/transfer");

  const { data: profile } = await supabase
    .from("profiles")
    .select("whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen flex flex-col">
      <Header showApiKey={false} />
      <main className="flex-1 container py-10 sm:py-14">
        <TransferClient
          userId={user.id}
          email={user.email ?? ""}
          defaultWhatsapp={profile?.whatsapp ?? ""}
        />
      </main>
      <Footer />
    </div>
  );
}
