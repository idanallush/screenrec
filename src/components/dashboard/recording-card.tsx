"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { formatDuration, formatRelativeDate, formatFileSize } from "@/lib/utils";
import {
  Play,
  Link as LinkIcon,
  Trash2,
  Eye,
  MoreVertical,
  Pencil,
  Tag as TagIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TagBadge } from "@/components/ui/tag-badge";
import { toast } from "sonner";
import type { Recording, Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecordingCardProps {
  recording: Recording;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  tags?: Tag[];
  allTags?: Tag[];
  onAddTag?: (recordingId: string, tagId: string) => void;
  onRemoveTag?: (recordingId: string, tagId: string) => void;
  onCreateTag?: (name: string, color: string) => Promise<Tag | null>;
  onOpenTagPopover?: (recordingId: string, triggerRef: React.RefObject<HTMLElement | null>) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function RecordingCard({
  recording,
  onDelete,
  onRename,
  tags = [],
  onOpenTagPopover,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: RecordingCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(recording.title);
  const [deleting, setDeleting] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const tagTriggerRef = useRef<HTMLButtonElement>(null);

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

  function handleDeleteConfirm() {
    setDeleting(true);
    onDelete(recording.id);
    setShowDeleteConfirm(false);
    setDeleting(false);
  }

  function handleCardClick(e: React.MouseEvent) {
    if (selectionMode) {
      e.preventDefault();
      onToggleSelect?.(recording.id);
    }
  }

  const displayTags = tags.slice(0, 3);
  const overflowCount = tags.length - 3;

  return (
    <>
      <div
        className={cn(
          "group bg-surface rounded-xl border overflow-hidden transition-all duration-200",
          selectionMode
            ? selected
              ? "border-primary ring-2 ring-primary/30"
              : "border-border hover:border-primary/30"
            : "border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5"
        )}
        onClick={handleCardClick}
      >
        {/* Thumbnail / Preview */}
        {selectionMode ? (
          <div className="relative aspect-video bg-gray-900 flex items-center justify-center cursor-pointer overflow-hidden">
            {recording.thumbnail ? (
              <img
                src={recording.thumbnail}
                alt={recording.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : null}
            <Play className="relative w-12 h-12 text-white/60 transition-all duration-200 drop-shadow-lg" />
            {/* Selection checkbox */}
            <div
              className={cn(
                "absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150",
                selected
                  ? "bg-primary border-primary"
                  : "bg-white/80 border-white/60"
              )}
            >
              {selected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded font-mono">
              {formatDuration(recording.duration)}
            </span>
          </div>
        ) : (
          <Link href={`/watch/${recording.id}`}>
            <div className="relative aspect-video bg-gray-900 flex items-center justify-center cursor-pointer overflow-hidden">
              {recording.thumbnail ? (
                <img
                  src={recording.thumbnail}
                  alt={recording.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : null}
              <Play className="relative w-12 h-12 text-white/60 group-hover:text-white/90 group-hover:scale-110 transition-all duration-200 drop-shadow-lg" />
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded font-mono">
                {formatDuration(recording.duration)}
              </span>
              {recording.status === "processing" && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500/80 text-white text-xs rounded animate-pulse">
                  Processing...
                </span>
              )}
            </div>
          </Link>
        )}

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

            {!selectionMode && (
              <Button
                ref={menuTriggerRef}
                variant="ghost"
                size="icon"
                className={cn(
                  "w-7 h-7 shrink-0 transition-opacity duration-200",
                  showMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Tags */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
              {overflowCount > 0 && (
                <span className="text-xs text-muted px-1.5 py-0.5">
                  +{overflowCount}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted">
            <span suppressHydrationWarning>{formatRelativeDate(recording.createdAt)}</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {recording.viewCount}
            </span>
            <span>{formatFileSize(recording.fileSize)}</span>
          </div>
        </div>
      </div>

      {/* Portal-rendered dropdown menu */}
      <DropdownMenu
        open={showMenu}
        onClose={() => setShowMenu(false)}
        triggerRef={menuTriggerRef}
      >
        <DropdownItem
          icon={<Pencil className="w-3.5 h-3.5" />}
          label="Rename"
          onClick={() => {
            setIsRenaming(true);
            setShowMenu(false);
          }}
        />
        <DropdownItem
          icon={<LinkIcon className="w-3.5 h-3.5" />}
          label="Copy Link"
          onClick={() => {
            copyLink();
            setShowMenu(false);
          }}
        />
        <DropdownItem
          icon={<TagIcon className="w-3.5 h-3.5" />}
          label="Add Tag"
          onClick={() => {
            setShowMenu(false);
            onOpenTagPopover?.(recording.id, tagTriggerRef);
          }}
        />
        <DropdownItem
          icon={<Trash2 className="w-3.5 h-3.5" />}
          label="Delete"
          variant="danger"
          onClick={() => {
            setShowMenu(false);
            setShowDeleteConfirm(true);
          }}
        />
      </DropdownMenu>

      {/* Hidden ref for tag popover positioning */}
      <span ref={tagTriggerRef} className="hidden" />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Recording"
        description={`Are you sure you want to delete "${recording.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}
