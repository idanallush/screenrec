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
        // Upload directly to Vercel Blob from the browser
        const result = await vercelUpload(
          `recordings/${recordingId}.webm`,
          blob,
          {
            access: "public",
            handleUploadUrl: "/api/upload",
            onUploadProgress: (e) => {
              setProgress(e.percentage);
            },
          }
        );

        // The onUploadCompleted callback on the server updates the DB,
        // but it may not have fired yet. Update manually as well.
        const res = await fetch(`/api/recordings/${recordingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blobUrl: result.url,
            fileSize: blob.size,
            status: "ready",
          }),
        });

        const recording = await res.json();

        setUploading(false);
        setProgress(100);
        options.onComplete?.(recording);
      } catch (err) {
        setUploading(false);
        options.onError?.((err as Error).message);
      }
    },
    []
  );

  return { upload, progress, uploading };
}
