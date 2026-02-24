export interface Recording {
  id: string;
  title: string;
  blobUrl: string;
  fileSize: number;
  duration: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  hasWebcam: boolean;
  thumbnail: string | null;
  viewCount: number;
  status: "processing" | "ready" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface RecordingRow {
  id: string;
  title: string;
  blob_url: string;
  file_size: number;
  duration: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  has_webcam: number;
  thumbnail: string | null;
  view_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export type RecorderState =
  | "IDLE"
  | "PREVIEWING"
  | "COUNTDOWN"
  | "RECORDING"
  | "PAUSED"
  | "STOPPED"
  | "UPLOADING"
  | "DONE";

export type WebcamPosition =
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";

export interface RecordingSettings {
  includeWebcam: boolean;
  webcamDeviceId: string | null;
  micDeviceId: string | null;
  webcamPosition: WebcamPosition;
  webcamSize: number;
  includeSystemAudio: boolean;
}
