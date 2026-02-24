/**
 * Generates a thumbnail image from a video Blob.
 * Seeks to 1 second (or 0 if shorter), captures a frame,
 * and returns a JPEG data URL.
 */
export function generateThumbnail(
  videoBlob: Blob,
  options: { width?: number; height?: number; quality?: number; seekTime?: number } = {}
): Promise<string> {
  const {
    width = 320,
    height = 180,
    quality = 0.7,
    seekTime = 1,
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(videoBlob);
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    let resolved = false;

    function cleanup() {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    }

    function captureFrame() {
      if (resolved) return;
      resolved = true;

      try {
        const canvas = document.createElement("canvas");
        // Maintain aspect ratio
        const vw = video.videoWidth || width;
        const vh = video.videoHeight || height;
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

    video.addEventListener("loadeddata", () => {
      // Seek to the desired time (or 0 if video is too short)
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

    // Timeout fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error("Thumbnail generation timed out"));
      }
    }, 10000);
  });
}
