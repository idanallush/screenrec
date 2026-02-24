import Link from "next/link";
import { Video, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  activeTag?: string;
}

export function EmptyState({ activeTag }: EmptyStateProps) {
  if (activeTag) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
          <TagIcon className="w-10 h-10 text-muted animate-bob" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            No recordings with tag &quot;{activeTag}&quot;
          </h2>
          <p className="text-muted mt-1">
            Try removing the filter or adding this tag to some recordings
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary" size="lg">
            Clear Filter
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
        <Video className="w-10 h-10 text-muted animate-bob" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">No recordings yet</h2>
        <p className="text-muted mt-1">
          Create your first screen recording to get started
        </p>
      </div>
      <Link href="/record">
        <Button size="lg">Start Recording</Button>
      </Link>
    </div>
  );
}
