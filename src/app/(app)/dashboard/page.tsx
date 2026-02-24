import { getAllRecordings, getAllTagsWithCounts, getTagsForRecordings } from "@/lib/db-queries";
import { RecordingGrid } from "@/components/dashboard/recording-grid";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ tag?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { tag } = await searchParams;
  const recordings = await getAllRecordings(tag);
  const allTagsWithCounts = await getAllTagsWithCounts();
  const allTags = allTagsWithCounts.map(({ count: _count, ...t }) => t);
  const recordingTags = await getTagsForRecordings(
    recordings.map((r) => r.id)
  );

  return (
    <main className="p-6">
      <RecordingGrid
        recordings={recordings}
        allTags={allTags}
        allTagsWithCounts={allTagsWithCounts}
        recordingTags={recordingTags}
        activeTag={tag}
      />
    </main>
  );
}
