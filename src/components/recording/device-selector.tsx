"use client";

import { Camera, Mic } from "lucide-react";

interface DeviceSelectorProps {
  cameras: { deviceId: string; label: string }[];
  microphones: { deviceId: string; label: string }[];
  selectedCamera: string | null;
  selectedMic: string | null;
  onCameraChange: (deviceId: string) => void;
  onMicChange: (deviceId: string) => void;
}

export function DeviceSelector({
  cameras,
  microphones,
  selectedCamera,
  selectedMic,
  onCameraChange,
  onMicChange,
}: DeviceSelectorProps) {
  return (
    <div className="space-y-3">
      {cameras.length > 0 && (
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-muted" />
          <select
            value={selectedCamera || ""}
            onChange={(e) => onCameraChange(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {cameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {microphones.length > 0 && (
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-muted" />
          <select
            value={selectedMic || ""}
            onChange={(e) => onMicChange(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {microphones.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
