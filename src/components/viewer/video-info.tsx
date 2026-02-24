"use client";

import { useState, useEffect } from "react";
import { formatRelativeDate } from "@/lib/utils";
import { Eye } from "lucide-react";
import type { Recording } from "@/lib/types";

interface VideoInfoProps {
  recording: Recording;
}

export function VideoInfo({ recording }: VideoInfoProps) {
  // Render relative date only on client to avoid hydration mismatch
  const [relDate, setRelDate] = useState<string>("");

  useEffect(() => {
    setRelDate(formatRelativeDate(recording.createdAt));
  }, [recording.createdAt]);

  return (
    <div className="mt-4 space-y-1">
      <h1 className="text-xl font-bold">{recording.title}</h1>
      <div className="flex items-center gap-3 text-sm text-muted">
        <span>{relDate}</span>
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          {recording.viewCount} {recording.viewCount === 1 ? "view" : "views"}
        </span>
      </div>
    </div>
  );
}
