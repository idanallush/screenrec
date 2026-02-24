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
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
        console.log(`[Upload] Starting: ${sizeMB} MB for recording ${recordingId}`);

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
              // Log at 25% intervals
              if (
                Math.floor(e.percentage / 25) >
                Math.floor((e.percentage - 1) / 25)
              ) {
                console.log(`[Upload] Progress: ${Math.round(e.percentage)}%`);
              }
            },
          }
        );

        console.log("[Upload] Blob uploaded, updating DB...");

        // Update recording in DB with blob URL
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
          throw new Error(`Failed to save recording (${res.status})`);
        }

        const recording = await res.json();
        console.log("[Upload] Complete! Recording:", recording.id);

        setUploading(false);
        setProgress(100);
        options.onComplete?.(recording);
      } catch (err) {
        setUploading(false);
        let msg = "Upload failed";

        if (err instanceof Error) {
          msg = err.message;
          // User-friendly messages for common errors
          if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
            msg = "Network error — check your internet connection and try again";
          } else if (msg.includes("413") || msg.includes("too large")) {
            msg = "File is too large for upload";
          } else if (msg.includes("401") || msg.includes("403")) {
            msg = "Upload authentication expired — please try again";
          }
        }

        console.error("[Upload] Error:", msg, err);
        options.onError?.(msg);
      }
    },
    []
  );

  return { upload, progress, uploading };
}
