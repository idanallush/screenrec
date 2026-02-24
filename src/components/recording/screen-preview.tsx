"use client";

import { useRef, useEffect } from "react";

interface ScreenPreviewProps {
  stream: MediaStream | null;
  className?: string;
}

export function ScreenPreview({ stream, className }: ScreenPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className={className}
    />
  );
}
