import { getAnnouncement } from "@/lib/data/settings";
import { GenerateClient } from "./GenerateClient";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const announcement = await getAnnouncement();
  return <GenerateClient announcement={announcement} />;
}
