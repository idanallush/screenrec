import { RecordingCardSkeleton } from "./recording-card-skeleton";

export function RecordingGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <RecordingCardSkeleton key={i} />
      ))}
    </div>
  );
}
