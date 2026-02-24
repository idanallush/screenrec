import { RecordingGridSkeleton } from "@/components/dashboard/recording-grid-skeleton";

export default function DashboardLoading() {
  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-surface-hover rounded animate-pulse" />
        <div className="h-10 w-40 bg-surface-hover rounded animate-pulse" />
      </div>
      <RecordingGridSkeleton />
    </main>
  );
}
