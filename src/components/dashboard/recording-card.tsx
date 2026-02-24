"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDuration, formatRelativeDate, formatFileSize } from "@/lib/utils";
import { Play, Link as LinkIcon, Trash2, Eye, MoreVertical, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Recording } from "@/lib/types";

interface RecordingCardProps {
  recording: Recording;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function RecordingCard({ recording, onDelete, onRename }: RecordingCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(recording.title);

  async function copyLink() {
    const url = `${window.location.origin}/watch/${recording.id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  }

  function handleRename() {
    if (title.trim() && title !== recording.title) {
      onRename(recording.id, title.trim());
    }
    setIsRenaming(false);
  }

  return (
    <div className="group bg-surface rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors">
      {/* Thumbnail / Preview */}
      <Link href={`/watch/${recording.id}`}>
        <div className="relative aspect-video bg-gray-900 flex items-center justify-center cursor-pointer">
          <Play className="w-12 h-12 text-white/60 group-hover:text-white/90 transition-colors" />

          {/* Duration badge */}
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded font-mono">
            {formatDuration(recording.duration)}
          </span>

          {recording.status === "processing" && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500/80 text-white text-xs rounded">
              Processing...
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          {isRenaming ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              className="flex-1 px-1 py-0.5 text-sm font-medium bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <h3 className="text-sm font-medium truncate flex-1">
              {recording.title}
            </h3>
          )}

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 opacity-0 group-hover:opacity-100"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-20 w-40 bg-background border border-border rounded-lg shadow-lg py-1">
                  <button
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      setIsRenaming(true);
                      setShowMenu(false);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Rename
                  </button>
                  <button
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      copyLink();
                      setShowMenu(false);
                    }}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Copy Link
                  </button>
                  <button
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface flex items-center gap-2 text-red-500 cursor-pointer"
                    onClick={() => {
                      onDelete(recording.id);
                      setShowMenu(false);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{formatRelativeDate(recording.createdAt)}</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {recording.viewCount}
          </span>
          <span>{formatFileSize(recording.fileSize)}</span>
        </div>
      </div>
    </div>
  );
}
