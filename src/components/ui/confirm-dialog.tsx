"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Delete",
  confirmVariant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    },
    [onCancel, loading]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => !loading && onCancel()}
      />
      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-dialog-enter">
        <div className="bg-background border border-border rounded-xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted">{description}</p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant={confirmVariant}
              size="sm"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Deleting..." : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
