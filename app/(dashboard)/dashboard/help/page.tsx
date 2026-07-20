import { TutorialSection } from "@/components/dashboard/TutorialSection";
import { getTutorial } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export default async function DashboardHelpPage() {
  const tutorial = await getTutorial();
  return <TutorialSection youtubeId={tutorial.youtubeId} steps={tutorial.steps} />;
}
