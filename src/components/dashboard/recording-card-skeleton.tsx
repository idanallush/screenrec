export function RecordingCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-video bg-surface-hover" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-surface-hover rounded w-3/4" />
        <div className="h-3 bg-surface-hover rounded w-1/2" />
      </div>
    </div>
  );
}
