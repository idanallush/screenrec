"use client";

import { useState, useCallback } from "react";
import { upload as vercelUpload } from "@vercel/blob/client";
import type { Recording } from "@/lib/types";

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (options: {
      blob: Blob;
      recordingId: string;
      onComplete?: (recording: Recording) => void;
      onError?: (error: string) => void;
    }) => {
      const { blob, recordingId } = options;
      setUploading(true);
      setProgress(0);

      try {
        // Upload directly from browser to Vercel Blob
        const result = await vercelUpload(
          `recordings/${recordingId}.webm`,
          blob,
          {
            access: "public",
            handleUploadUrl: "/api/upload",
            clientPayload: JSON.stringify({ recordingId }),
            onUploadProgress: (e) => {
              setProgress(e.percentage);
            },
          }
        );

        // Client-side DB update as fallback
        // (onUploadCompleted webhook may not have fired yet)
        const res = await fetch(`/api/recordings/${recordingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blobUrl: result.url,
            fileSize: blob.size,
            status: "ready",
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `PATCH failed: ${res.status}`);
        }

        const recording = await res.json();

        setUploading(false);
        setProgress(100);
        options.onComplete?.(recording);
      } catch (err) {
        setUploading(false);
        const msg = err instanceof Error ? err.message : "Upload failed";
        console.error("Upload error:", err);
        options.onError?.(msg);
      }
    },
    []
  );

  return { upload, progress, uploading };
}
