"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/types";

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  onClick?: () => void;
  size?: "sm" | "md";
  active?: boolean;
}

export function TagBadge({
  tag,
  onRemove,
  onClick,
  size = "sm",
  active = false,
}: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border transition-all duration-150",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        active
          ? "text-white border-transparent"
          : "bg-surface border-border hover:border-primary/30",
        onClick && "cursor-pointer"
      )}
      style={active ? { backgroundColor: tag.color } : undefined}
      onClick={onClick}
    >
      <span
        className={cn(
          "rounded-full shrink-0",
          size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5"
        )}
        style={{ backgroundColor: active ? "white" : tag.color }}
      />
      <span className="truncate max-w-[80px]">{tag.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-danger transition-colors cursor-pointer"
        >
          <X className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </button>
      )}
    </span>
  );
}
