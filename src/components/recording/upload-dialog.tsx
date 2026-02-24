"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useUpload } from "@/hooks/use-chunked-upload";
import { Upload, Link, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Recording } from "@/lib/types";

interface UploadDialogProps {
  blob: Blob;
  thumbnail: string | null;
  duration: number;
  onComplete: (recording: Recording) => void;
  onDiscard: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDialog({
  blob,
  thumbnail,
  duration,
  onComplete,
  onDiscard,
}: UploadDialogProps) {
  const [title, setTitle] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { upload, progress, uploading } = useUpload();
  const previewUrlRef = useRef<string | null>(null);

  // Create ObjectURL only once, clean up on unmount
  const previewUrl = useMemo(() => {
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    return url;
  }, [blob]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  async function handleUpload() {
    setUploadError(null);

    try {
      // Step 1: Create recording metadata
      setUploadStatus("Creating recording...");
      console.log("[Upload] Creating recording, size:", formatFileSize(blob.size));

      const res = await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled Recording",
          duration,
          thumbnail, // captured from live stream — may be null
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to create recording: ${errText}`);
      }

      const recording = await res.json();
      console.log("[Upload] Recording created:", recording.id);

      // Step 2: Upload the video file
      setUploadStatus("Uploading video...");

      await upload({
        blob,
        recordingId: recording.id,
        onComplete: (updated) => {
          setUploadStatus("");
          const url = `${window.location.origin}/watch/${updated.id}`;
          setShareUrl(url);
          toast.success("Recording uploaded!");
          onComplete(updated);
        },
        onError: (err) => {
          setUploadError(err);
          setUploadStatus("");
          toast.error(`Upload failed: ${err}`);
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Upload] Error:", msg);
      setUploadError(msg);
      setUploadStatus("");
      toast.error(msg);
    }
  }

  async function copyLink() {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-surface rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Save Recording</h2>
        {!uploading && !shareUrl && (
          <Button variant="ghost" size="icon" onClick={onDiscard}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Preview — preload="metadata" avoids loading entire file into memory */}
      <div className="rounded-lg overflow-hidden bg-black aspect-video">
        <video
          src={previewUrl}
          controls
          preload="metadata"
          className="w-full h-full"
        />
      </div>

      {/* File info */}
      <p className="text-xs text-muted text-center">
        {formatFileSize(blob.size)} &middot;{" "}
        {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
      </p>

      {!shareUrl ? (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Recording"
            disabled={uploading}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />

          {uploading && (
            <div className="space-y-2">
              <ProgressBar value={progress} />
              <p className="text-sm text-muted text-center">
                {uploadStatus || `Uploading... ${Math.round(progress)}%`}
              </p>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? uploadStatus || "Uploading..." : "Save & Share"}
          </Button>

          {uploadError && !uploading && (
            <Button
              onClick={handleUpload}
              variant="outline"
              className="w-full gap-2"
            >
              Retry Upload
            </Button>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400">
              Recording saved!
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
            />
            <Button onClick={copyLink} variant="secondary" className="gap-2">
              <Link className="w-4 h-4" />
              Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
