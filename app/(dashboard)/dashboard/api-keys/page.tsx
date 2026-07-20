import { ProviderKeysPanel } from "@/components/api-key/ProviderKeysPanel";
import { LegacyApiKeyCard } from "@/components/dashboard/LegacyApiKeyCard";
import { USE_GATEWAY } from "@/lib/config/flags";

export default function DashboardApiKeysPage() {
  return USE_GATEWAY ? <ProviderKeysPanel /> : <LegacyApiKeyCard />;
}
