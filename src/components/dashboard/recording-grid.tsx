"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecordingCard } from "./recording-card";
import { TagFilter } from "./tag-filter";
import { TagPopover } from "./tag-popover";
import { EmptyState } from "./empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Plus,
  CheckSquare,
  X,
  Trash2,
  CheckCheck,
} from "lucide-react";
import type { Recording, Tag, TagWithCount } from "@/lib/types";

interface RecordingGridProps {
  recordings: Recording[];
  allTags?: Tag[];
  allTagsWithCounts?: TagWithCount[];
  recordingTags?: Record<string, Tag[]>;
  activeTag?: string;
}

export function RecordingGrid({
  recordings: initial,
  allTags = [],
  allTagsWithCounts = [],
  recordingTags: initialRecordingTags = {},
  activeTag,
}: RecordingGridProps) {
  const [recordings, setRecordings] = useState(initial);
  const [recordingTags, setRecordingTags] = useState(initialRecordingTags);
  const [tags, setTags] = useState(allTags);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [tagPopover, setTagPopover] = useState<{
    recordingId: string;
    triggerRef: React.RefObject<HTMLElement | null>;
  } | null>(null);
  const router = useRouter();
  const popoverTriggerRef = useRef<HTMLElement | null>(null);

  // ─── Recording Actions ────────────────────────────────────

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

  // ─── Tag Actions ──────────────────────────────────────────

  const handleAddTag = useCallback(
    async (recordingId: string, tagId: string) => {
      await fetch(`/api/recordings/${recordingId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        setRecordingTags((prev) => ({
          ...prev,
          [recordingId]: [...(prev[recordingId] || []), tag],
        }));
      }
      router.refresh();
    },
    [tags, router]
  );

  const handleRemoveTag = useCallback(
    async (recordingId: string, tagId: string) => {
      await fetch(`/api/recordings/${recordingId}/tags`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      setRecordingTags((prev) => ({
        ...prev,
        [recordingId]: (prev[recordingId] || []).filter((t) => t.id !== tagId),
      }));
      router.refresh();
    },
    [router]
  );

  const handleCreateTag = useCallback(
    async (name: string, color: string): Promise<Tag | null> => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (res.ok) {
        const tag = await res.json();
        setTags((prev) => [...prev, tag]);
        return tag;
      }
      toast.error("Failed to create tag");
      return null;
    },
    []
  );

  const handleOpenTagPopover = useCallback(
    (recordingId: string, triggerRef: React.RefObject<HTMLElement | null>) => {
      popoverTriggerRef.current = triggerRef.current;
      setTagPopover({
        recordingId,
        triggerRef: { current: popoverTriggerRef.current } as React.RefObject<HTMLElement | null>,
      });
    },
    []
  );

  // ─── Selection Actions ────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(recordings.map((r) => r.id)));
  }, [recordings]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const res = await fetch("/api/recordings/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      const { deleted } = await res.json();
      setRecordings((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      toast.success(`Deleted ${deleted} recording${deleted > 1 ? "s" : ""}`);
      exitSelectionMode();
      router.refresh();
    } else {
      toast.error("Failed to delete recordings");
    }
    setBulkDeleting(false);
    setShowBulkDeleteConfirm(false);
  }, [selectedIds, exitSelectionMode, router]);

  // ─── Render ───────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {selectionMode ? (
          <>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedIds.size === recordings.length ? deselectAll : selectAll}
                className="gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                {selectedIds.size === recordings.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                className="gap-1.5"
                disabled={selectedIds.size === 0}
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedIds.size})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSelectionMode}
                className="gap-1.5"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">My Recordings</h1>
            <div className="flex items-center gap-2">
              {recordings.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSelectionMode(true)}
                >
                  <CheckSquare className="w-4 h-4" />
                  Select
                </Button>
              )}
              <Link href="/record">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Recording
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Tag filter bar */}
      <TagFilter tags={allTagsWithCounts} activeTag={activeTag} />

      {/* Grid or empty state */}
      {recordings.length === 0 ? (
        <EmptyState activeTag={activeTag} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recordings.map((rec) => (
            <RecordingCard
              key={rec.id}
              recording={rec}
              onDelete={handleDelete}
              onRename={handleRename}
              tags={recordingTags[rec.id] || []}
              allTags={tags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onCreateTag={handleCreateTag}
              onOpenTagPopover={handleOpenTagPopover}
              selectionMode={selectionMode}
              selected={selectedIds.has(rec.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Tag popover */}
      {tagPopover && (
        <TagPopover
          open={true}
          onClose={() => setTagPopover(null)}
          triggerRef={tagPopover.triggerRef}
          recordingId={tagPopover.recordingId}
          tags={recordingTags[tagPopover.recordingId] || []}
          allTags={tags}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onCreateTag={handleCreateTag}
        />
      )}

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        title="Delete Recordings"
        description={`Are you sure you want to delete ${selectedIds.size} recording${selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.size}`}
        confirmVariant="danger"
        loading={bulkDeleting}
      />
    </>
  );
}
