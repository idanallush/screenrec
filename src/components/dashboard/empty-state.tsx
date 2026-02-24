import Link from "next/link";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <Video className="w-16 h-16 text-muted" />
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
