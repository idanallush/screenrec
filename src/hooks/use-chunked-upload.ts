"use client";

import { useState, useCallback } from "react";
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
        const formData = new FormData();
        formData.append("file", blob, `${recordingId}.webm`);
        formData.append("recordingId", recordingId);

        const xhr = new XMLHttpRequest();

        const recording = await new Promise<Recording>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress((e.loaded / e.total) * 100);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error("Upload failed"));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

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
