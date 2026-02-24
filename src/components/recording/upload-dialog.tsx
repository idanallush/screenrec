"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useUpload } from "@/hooks/use-chunked-upload";
import { Upload, Link, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Recording } from "@/lib/types";

interface UploadDialogProps {
  blob: Blob;
  duration: number;
  onComplete: (recording: Recording) => void;
  onDiscard: () => void;
}

export function UploadDialog({
  blob,
  duration,
  onComplete,
  onDiscard,
}: UploadDialogProps) {
  const [title, setTitle] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { upload, progress, uploading } = useUpload();

  async function handleUpload() {
    // Step 1: Create recording metadata
    const res = await fetch("/api/recordings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "Untitled Recording",
        duration,
      }),
    });

    if (!res.ok) {
      toast.error("Failed to create recording");
      return;
    }

    const recording = await res.json();

    // Step 2: Upload the video
    await upload({
      blob,
      recordingId: recording.id,
      onComplete: (updated) => {
        const url = `${window.location.origin}/watch/${updated.id}`;
        setShareUrl(url);
        toast.success("Recording uploaded!");
        onComplete(updated);
      },
      onError: (err) => {
        toast.error(`Upload failed: ${err}`);
      },
    });
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

      {/* Preview */}
      <div className="rounded-lg overflow-hidden bg-black aspect-video">
        <video
          src={URL.createObjectURL(blob)}
          controls
          className="w-full h-full"
        />
      </div>

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
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Save & Share"}
          </Button>
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
