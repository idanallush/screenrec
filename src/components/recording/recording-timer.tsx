"use client";

import { formatDuration } from "@/lib/utils";
import type { RecorderState } from "@/lib/types";

interface RecordingTimerProps {
  duration: number;
  state: RecorderState;
}

export function RecordingTimer({ duration, state }: RecordingTimerProps) {
  return (
    <div className="flex items-center gap-2">
      {(state === "RECORDING" || state === "PAUSED") && (
        <span
          className={`w-3 h-3 rounded-full ${
            state === "RECORDING"
              ? "bg-red-500 animate-pulse"
              : "bg-yellow-500"
          }`}
        />
      )}
      <span
        className={`font-mono text-lg tabular-nums ${
          state === "PAUSED" ? "animate-pulse" : ""
        }`}
      >
        {formatDuration(duration)}
      </span>
    </div>
  );
}
