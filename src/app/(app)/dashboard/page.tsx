import Link from "next/link";
import { getAllRecordings } from "@/lib/db-queries";
import { RecordingGrid } from "@/components/dashboard/recording-grid";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const recordings = await getAllRecordings();

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Recordings</h1>
        <Link href="/record">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Recording
          </Button>
        </Link>
      </div>

      {recordings.length === 0 ? (
        <EmptyState />
      ) : (
        <RecordingGrid recordings={recordings} />
      )}
    </main>
  );
}
