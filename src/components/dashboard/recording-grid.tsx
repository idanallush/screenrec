"use client";

import { useState, useCallback } from "react";
import { RecordingCard } from "./recording-card";
import { toast } from "sonner";
import type { Recording } from "@/lib/types";
import { useRouter } from "next/navigation";

interface RecordingGridProps {
  recordings: Recording[];
}

export function RecordingGrid({ recordings: initial }: RecordingGridProps) {
  const [recordings, setRecordings] = useState(initial);
  const router = useRouter();

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/recordings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecordings((prev) => prev.filter((r) => r.id !== id));
        toast.success("Recording deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete recording");
      }
    },
    [router]
  );

  const handleRename = useCallback(
    async (id: string, title: string) => {
      const res = await fetch(`/api/recordings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setRecordings((prev) =>
          prev.map((r) => (r.id === id ? { ...r, title } : r))
        );
        toast.success("Renamed");
      } else {
        toast.error("Failed to rename");
      }
    },
    []
  );

  if (recordings.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {recordings.map((rec) => (
        <RecordingCard
          key={rec.id}
          recording={rec}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      ))}
    </div>
  );
}
