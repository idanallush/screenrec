"use client";

import { Button } from "@/components/ui/button";
import { Pause, Play, Square, Trash2, Circle } from "lucide-react";
import type { RecorderState } from "@/lib/types";

interface RecordingControlsProps {
  state: RecorderState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
}

export function RecordingControls({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
  onDiscard,
}: RecordingControlsProps) {
  if (state === "PREVIEWING") {
    return (
      <Button size="lg" variant="danger" onClick={onStart} className="gap-2">
        <Circle className="w-5 h-5 fill-current" />
        Start Recording
      </Button>
    );
  }

  if (state === "RECORDING" || state === "PAUSED") {
    return (
      <div className="flex items-center gap-3">
        {state === "RECORDING" ? (
          <Button variant="secondary" size="icon" onClick={onPause} title="Pause">
            <Pause className="w-5 h-5" />
          </Button>
        ) : (
          <Button variant="secondary" size="icon" onClick={onResume} title="Resume">
            <Play className="w-5 h-5" />
          </Button>
        )}

        <Button variant="danger" onClick={onStop} className="gap-2">
          <Square className="w-4 h-4 fill-current" />
          Stop
        </Button>

        <Button variant="ghost" size="icon" onClick={onDiscard} title="Discard">
          <Trash2 className="w-5 h-5 text-muted" />
        </Button>
      </div>
    );
  }

  return null;
}
