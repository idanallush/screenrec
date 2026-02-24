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
        console.log("[Upload] Starting Vercel Blob upload for:", recordingId);

        // Upload directly from browser to Vercel Blob
        const result = await vercelUpload(
          `recordings/${recordingId}.webm`,
          blob,
          {
            access: "private",
            handleUploadUrl: "/api/upload",
            multipart: true,
            clientPayload: JSON.stringify({ recordingId }),
            onUploadProgress: (e) => {
              setProgress(e.percentage);
            },
          }
        );

        console.log("[Upload] Blob uploaded successfully:", result.url);

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
          const errText = await res.text().catch(() => "");
          console.error("[Upload] PATCH failed:", res.status, errText);
          throw new Error(`Save failed (${res.status}): ${errText}`);
        }

        const recording = await res.json();

        setUploading(false);
        setProgress(100);
        options.onComplete?.(recording);
      } catch (err) {
        setUploading(false);
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[Upload] Error:", msg, err);
        options.onError?.(msg);
      }
    },
    []
  );

  return { upload, progress, uploading };
}
