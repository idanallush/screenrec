"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { TagInput } from "@/components/ui/tag-input";
import type { Tag } from "@/lib/types";

interface TagPopoverProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  recordingId: string;
  tags: Tag[];
  allTags: Tag[];
  onAddTag: (recordingId: string, tagId: string) => void;
  onRemoveTag: (recordingId: string, tagId: string) => void;
  onCreateTag: (name: string, color: string) => Promise<Tag | null>;
}

export function TagPopover({
  open,
  onClose,
  triggerRef,
  recordingId,
  tags,
  allTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: TagPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const padding = 8;
    let top = trigger.bottom + 4;
    let left = trigger.left;

    // Keep within viewport
    if (left + 260 > window.innerWidth - padding) {
      left = window.innerWidth - 260 - padding;
    }
    if (left < padding) left = padding;
    if (top + 200 > window.innerHeight - padding) {
      top = trigger.top - 200 - 4;
    }
    setPosition({ top, left });
  }, [triggerRef]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(updatePosition);
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, updatePosition, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={popoverRef}
        className="fixed z-50 w-64 bg-background border border-border rounded-xl shadow-xl p-3 animate-dropdown-enter"
        style={{ top: position.top, left: position.left }}
      >
        <h4 className="text-xs font-medium text-muted mb-2">Manage Tags</h4>
        <TagInput
          existingTags={allTags}
          selectedTags={tags}
          onAddTag={(tagId) => onAddTag(recordingId, tagId)}
          onCreateTag={onCreateTag}
          onRemoveTag={(tagId) => onRemoveTag(recordingId, tagId)}
        />
      </div>
    </>,
    document.body
  );
}
