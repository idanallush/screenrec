export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export const SUPPORTED_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
] as const;

export const VIDEO_BITRATE = 2_500_000; // 2.5 Mbps

export const WEBCAM_DEFAULT_SIZE = 180; // pixels diameter

export const RECORDING_FPS = 30;

export const TAG_COLORS = [
  "#6d28d9", // purple
  "#2563eb", // blue
  "#0891b2", // cyan
  "#059669", // emerald
  "#65a30d", // lime
  "#ca8a04", // yellow
  "#ea580c", // orange
  "#dc2626", // red
  "#db2777", // pink
  "#7c3aed", // violet
] as const;
