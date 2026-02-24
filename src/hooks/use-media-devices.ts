"use client";

import { useState, useEffect, useCallback } from "react";

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export function useMediaDevices() {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);

  const enumerate = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(
        devices
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 4)}`,
            kind: d.kind,
          }))
      );
      setMicrophones(
        devices
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${d.deviceId.slice(0, 4)}`,
            kind: d.kind,
          }))
      );
    } catch (err) {
      console.error("Failed to enumerate devices:", err);
    }
  }, []);

  useEffect(() => {
    enumerate();
    navigator.mediaDevices.addEventListener("devicechange", enumerate);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", enumerate);
    };
  }, [enumerate]);

  return { cameras, microphones, refresh: enumerate };
}
