"use client";

import type { WebcamPosition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WebcamPositionPickerProps {
  value: WebcamPosition;
  onChange: (position: WebcamPosition) => void;
}

const positions: WebcamPosition[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

export function WebcamPositionPicker({
  value,
  onChange,
}: WebcamPositionPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5 w-16 h-16 p-1.5 bg-surface rounded-lg border border-border">
      {positions.map((pos) => (
        <button
          key={pos}
          onClick={() => onChange(pos)}
          className={cn(
            "w-full h-full rounded-sm transition-colors cursor-pointer",
            value === pos
              ? "bg-primary"
              : "bg-surface-hover hover:bg-border"
          )}
        />
      ))}
    </div>
  );
}
