"use client";

import { useRef, useEffect } from "react";
import type { WebcamPosition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WebcamPreviewProps {
  stream: MediaStream | null;
  position: WebcamPosition;
  size?: number;
}

const positionClasses: Record<WebcamPosition, string> = {
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
};

export function WebcamPreview({
  stream,
  position,
  size = 160,
}: WebcamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div
      className={cn(
        "absolute rounded-full overflow-hidden border-3 border-white shadow-lg",
        positionClasses[position]
      )}
      style={{ width: size, height: size }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover scale-x-[-1]"
      />
    </div>
  );
}
