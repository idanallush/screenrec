"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagIcon } from "@/components/ui/tag-icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TAG_COLORS, TAG_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TagWithCount } from "@/lib/types";

interface ManageTagsDialogProps {
  open: boolean;
  onClose: () => void;
  tags: TagWithCount[];
  onTagsChange: (tags: TagWithCount[]) => void;
}

type EditingTag = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export function ManageTagsDialog({
  open,
  onClose,
  tags,
  onTagsChange,
}: ManageTagsDialogProps) {
  const [editing, setEditing] = useState<EditingTag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TagWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTag, setNewTag] = useState<{ name: string; color: string; icon: string }>({
    name: "",
    color: TAG_COLORS[0],
    icon: "tag",
  });

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setEditing(null);
      setDeleteTarget(null);
      setShowIconPicker(false);
      setCreating(false);
      setNewTag({ name: "", color: TAG_COLORS[0], icon: "tag" });
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editing) {
          setEditing(null);
          setShowIconPicker(false);
        } else if (creating) {
          setCreating(false);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, editing, creating]);

  const handleSave = useCallback(async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tags/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name.trim(),
          color: editing.color,
          icon: editing.icon,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onTagsChange(
          tags.map((t) =>
            t.id === updated.id
              ? { ...t, name: updated.name, color: updated.color, icon: updated.icon }
              : t
          )
        );
        toast.success("Tag updated");
        setEditing(null);
        setShowIconPicker(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update tag");
      }
    } catch {
      toast.error("Failed to update tag");
    }
    setSaving(false);
  }, [editing, tags, onTagsChange]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tags/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        onTagsChange(tags.filter((t) => t.id !== deleteTarget.id));
        toast.success(`Tag "${deleteTarget.name}" deleted`);
      } else {
        toast.error("Failed to delete tag");
      }
    } catch {
      toast.error("Failed to delete tag");
    }
    setDeleting(false);
    setDeleteTarget(null);
  }, [deleteTarget, tags, onTagsChange]);

  const handleCreate = useCallback(async () => {
    if (!newTag.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTag.name.trim(),
          color: newTag.color,
          icon: newTag.icon,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        onTagsChange([...tags, { ...created, count: 0 }]);
        toast.success("Tag created");
        setCreating(false);
        setNewTag({ name: "", color: TAG_COLORS[0], icon: "tag" });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create tag");
      }
    } catch {
      toast.error("Failed to create tag");
    }
    setSaving(false);
  }, [newTag, tags, onTagsChange]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] animate-[fade-in_150ms_ease-out]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-lg max-h-[80vh] flex flex-col bg-surface border border-border rounded-xl shadow-2xl animate-[dialog-enter_200ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Manage Tags</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tag list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
          {tags.length === 0 && !creating && (
            <p className="text-sm text-muted text-center py-8">
              No tags yet. Create one to get started.
            </p>
          )}

          {tags.map((tag) => {
            const isEditing = editing?.id === tag.id;

            if (isEditing) {
              return (
                <div
                  key={tag.id}
                  className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3"
                >
                  {/* Name input */}
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                    }}
                    autoFocus
                    className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Tag name"
                  />

                  {/* Color picker */}
                  <div>
                    <span className="text-xs text-muted font-medium mb-1.5 block">
                      Color
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setEditing({ ...editing, color })
                          }
                          className={cn(
                            "w-7 h-7 rounded-full transition-all duration-150 border-2",
                            editing.color === color
                              ? "border-foreground scale-110"
                              : "border-transparent hover:scale-110"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Icon picker */}
                  <div>
                    <span className="text-xs text-muted font-medium mb-1.5 block">
                      Icon
                    </span>
                    <button
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background border border-border rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <TagIcon
                        icon={editing.icon}
                        className="w-4 h-4"
                        style={{ color: editing.color }}
                      />
                      <span className="text-muted">{editing.icon}</span>
                    </button>

                    {showIconPicker && (
                      <div className="mt-2 p-2 bg-background border border-border rounded-lg grid grid-cols-8 gap-1">
                        {TAG_ICONS.map((iconName) => (
                          <button
                            key={iconName}
                            onClick={() => {
                              setEditing({ ...editing, icon: iconName });
                              setShowIconPicker(false);
                            }}
                            className={cn(
                              "w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150",
                              editing.icon === iconName
                                ? "bg-primary/15 ring-1 ring-primary"
                                : "hover:bg-surface-hover"
                            )}
                            title={iconName}
                          >
                            <TagIcon
                              icon={iconName}
                              className="w-4 h-4"
                              style={{
                                color:
                                  editing.icon === iconName
                                    ? editing.color
                                    : undefined,
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(null);
                        setShowIconPicker(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || !editing.name.trim()}
                      className="gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={tag.id}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <TagIcon
                  icon={tag.icon}
                  className="w-4 h-4 shrink-0"
                  style={{ color: tag.color }}
                />
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm flex-1 truncate">{tag.name}</span>
                <span className="text-xs text-muted">{tag.count}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={() => {
                      setEditing({
                        id: tag.id,
                        name: tag.name,
                        color: tag.color,
                        icon: tag.icon,
                      });
                      setShowIconPicker(false);
                    }}
                    className="p-1 rounded hover:bg-primary/10 hover:text-primary text-muted transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(tag)}
                    className="p-1 rounded hover:bg-red-500/10 hover:text-red-500 text-muted transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Create new tag form */}
          {creating && (
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3 mt-2">
              <input
                type="text"
                value={newTag.name}
                onChange={(e) =>
                  setNewTag({ ...newTag, name: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                autoFocus
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Tag name"
              />

              {/* Color picker */}
              <div>
                <span className="text-xs text-muted font-medium mb-1.5 block">
                  Color
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTag({ ...newTag, color })}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all duration-150 border-2",
                        newTag.color === color
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon picker */}
              <div>
                <span className="text-xs text-muted font-medium mb-1.5 block">
                  Icon
                </span>
                <div className="p-2 bg-background border border-border rounded-lg grid grid-cols-8 gap-1">
                  {TAG_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() =>
                        setNewTag({ ...newTag, icon: iconName })
                      }
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150",
                        newTag.icon === iconName
                          ? "bg-primary/15 ring-1 ring-primary"
                          : "hover:bg-surface-hover"
                      )}
                      title={iconName}
                    >
                      <TagIcon
                        icon={iconName}
                        className="w-4 h-4"
                        style={{
                          color:
                            newTag.icon === iconName
                              ? newTag.color
                              : undefined,
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Create / Cancel */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreating(false);
                    setNewTag({ name: "", color: TAG_COLORS[0], icon: "tag" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={saving || !newTag.name.trim()}
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {saving ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-between">
          {!creating && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setEditing(null);
                setShowIconPicker(false);
                setCreating(true);
              }}
            >
              <Plus className="w-4 h-4" />
              New Tag
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Tag"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? It will be removed from all recordings.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </>,
    document.body
  );
}
