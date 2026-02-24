"use client";

import { useState, useRef, useCallback } from "react";
import type { RecorderState } from "@/lib/types";
import { SUPPORTED_MIME_TYPES, VIDEO_BITRATE } from "@/lib/constants";

function getSupportedMimeType(): string {
  for (const type of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "video/webm";
}

export function useScreenRecorder() {
  const [state, setState] = useState<RecorderState>("IDLE");
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("video/webm");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const canvasStreamRef = useRef<MediaStream | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed =
        (Date.now() - startTimeRef.current) / 1000 +
        pausedDurationRef.current;
      setDuration(elapsed);
    }, 100);
  }, []);

  const cleanup = useCallback(() => {
    stopTimer();
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
    }
    setScreenStream(null);
    setWebcamStream(null);
    canvasStreamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    pausedDurationRef.current = 0;
  }, [screenStream, webcamStream, stopTimer]);

  const startScreenCapture = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        // User clicked browser's "Stop sharing" button
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        } else {
          cleanup();
          setState("IDLE");
        }
      });

      setScreenStream(stream);
      setState("PREVIEWING");
      return stream;
    } catch (err) {
      if ((err as Error).name === "NotAllowedError") {
        setError("Screen sharing was denied");
      } else {
        setError("Failed to capture screen");
      }
      setState("IDLE");
      return null;
    }
  }, [cleanup]);

  const startWebcam = useCallback(
    async (deviceId?: string) => {
      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: 320, height: 320 }
            : { width: 320, height: 320, facingMode: "user" },
          audio: true,
        };
        const stream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setWebcamStream(stream);
        return stream;
      } catch (err) {
        console.error("Failed to start webcam:", err);
        setError("Failed to access webcam");
        return null;
      }
    },
    []
  );

  const stopWebcam = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
    }
  }, [webcamStream]);

  const setCanvasStream = useCallback((stream: MediaStream) => {
    canvasStreamRef.current = stream;
  }, []);

  const startRecording = useCallback(() => {
    if (!screenStream) return;

    const detectedMime = getSupportedMimeType();
    setMimeType(detectedMime);
    chunksRef.current = [];

    // Determine which video stream to record
    const videoStream = canvasStreamRef.current || screenStream;

    // Collect all audio tracks
    const audioTracks = [
      ...screenStream.getAudioTracks(),
      ...(webcamStream?.getAudioTracks() ?? []),
    ];

    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioTracks,
    ]);

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: detectedMime,
      videoBitsPerSecond: VIDEO_BITRATE,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: detectedMime });
      setRecordedBlob(blob);
      stopTimer();
      setState("STOPPED");
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    pausedDurationRef.current = 0;
    setDuration(0);
    startTimer();
    setState("RECORDING");
  }, [screenStream, webcamStream, startTimer, stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      stopTimer();
      pausedDurationRef.current = duration;
      setState("PAUSED");
    }
  }, [duration, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      setState("RECORDING");
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    // Streams stay alive until user uploads or discards
  }, []);

  const discardRecording = useCallback(() => {
    setRecordedBlob(null);
    setDuration(0);
    cleanup();
    setState("IDLE");
  }, [cleanup]);

  const setUploading = useCallback(() => setState("UPLOADING"), []);
  const setDone = useCallback(() => {
    cleanup();
    setState("DONE");
  }, [cleanup]);

  return {
    state,
    screenStream,
    webcamStream,
    recordedBlob,
    duration,
    error,
    mimeType,
    startScreenCapture,
    startWebcam,
    stopWebcam,
    setCanvasStream,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    setUploading,
    setDone,
  };
}
