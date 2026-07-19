import { Megaphone } from "lucide-react";

export interface BannerAnnouncement {
  title?: string;
  message: string;
}

// Presentational maintenance/announcement banner. Renders nothing when absent.
// Plain component (no hooks) — usable from both server and client components.
export function AnnouncementBanner({
  announcement,
}: {
  announcement: BannerAnnouncement | null;
}) {
  if (!announcement?.message) return null;
  return (
    <div className="rounded-xl border border-banana/40 bg-banana/10 px-4 py-3 text-sm">
      <div className="flex items-start gap-2.5">
        <Megaphone className="mt-0.5 size-4 shrink-0 text-banana" />
        <div>
          {announcement.title && (
            <p className="font-semibold">{announcement.title}</p>
          )}
          <p className="text-muted-foreground">{announcement.message}</p>
        </div>
      </div>
    </div>
  );
}
