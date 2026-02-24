/**
 * Generates a thumbnail image from a video Blob.
 * Uses preload="metadata" to minimize memory usage.
 * Captures from first seekable frame.
 */
export function generateThumbnail(
  videoBlob: Blob,
  options: { width?: number; quality?: number; seekTime?: number } = {}
): Promise<string> {
  const {
    width = 320,
    quality = 0.6,
    seekTime = 1,
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(videoBlob);
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    // Only load metadata — don't buffer the entire file
    video.preload = "metadata";

    let resolved = false;

    function cleanup() {
      video.pause();
      video.removeAttribute("src");
      video.load();
      // Delay revoking URL slightly to let browser release refs
      setTimeout(() => URL.revokeObjectURL(url), 200);
    }

    function captureFrame() {
      if (resolved) return;
      resolved = true;

      try {
        const canvas = document.createElement("canvas");
        const vw = video.videoWidth || 1920;
        const vh = video.videoHeight || 1080;
        const aspect = vw / vh;
        canvas.width = width;
        canvas.height = Math.round(width / aspect);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    }

    video.addEventListener("seeked", captureFrame, { once: true });

    video.addEventListener("loadedmetadata", () => {
      // Seek to desired time (or 0 if shorter)
      const time = video.duration > seekTime ? seekTime : 0;
      video.currentTime = time;
    }, { once: true });

    video.addEventListener("error", () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error("Failed to load video for thumbnail"));
      }
    }, { once: true });

    // Generous timeout for large files
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error("Thumbnail generation timed out"));
      }
    }, 30000);
  });
}
