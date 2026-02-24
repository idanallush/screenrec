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
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedThumbnail, setRecordedThumbnail] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("video/webm");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setScreenStream(null);
    setWebcamStream(null);
    setMicStream(null);
    canvasStreamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    pausedDurationRef.current = 0;
  }, [screenStream, webcamStream, micStream, stopTimer]);

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
          audio: false, // Audio handled by separate microphone stream
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

  const startMicrophone = useCallback(
    async (deviceId?: string) => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
          video: false,
        };
        const stream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setMicStream(stream);
        console.log("[Mic] Microphone started, tracks:", stream.getAudioTracks().length);
        return stream;
      } catch (err) {
        console.error("[Mic] Failed to start microphone:", err);
        // Non-fatal: recording works without mic, just no narration audio
        return null;
      }
    },
    []
  );

  const stopMicrophone = useCallback(() => {
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      setMicStream(null);
    }
  }, [micStream]);

  const setCanvasStream = useCallback((stream: MediaStream) => {
    canvasStreamRef.current = stream;
  }, []);

  /** Capture a thumbnail frame from the live screen stream — instant, no blob loading */
  const captureThumbnail = useCallback(() => {
    try {
      const stream = canvasStreamRef.current || screenStream;
      if (!stream) return null;

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return null;

      const settings = videoTrack.getSettings();
      const vw = settings.width || 1920;
      const vh = settings.height || 1080;

      const canvas = document.createElement("canvas");
      const thumbWidth = 320;
      const aspect = vw / vh;
      canvas.width = thumbWidth;
      canvas.height = Math.round(thumbWidth / aspect);

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Try to find an active video element showing this stream
      const videoEl = document.querySelector("video");
      if (videoEl && videoEl.readyState >= 2) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        console.log("[Thumbnail] Captured from live stream");
        return dataUrl;
      }

      return null;
    } catch (err) {
      console.warn("[Thumbnail] Failed to capture from stream:", err);
      return null;
    }
  }, [screenStream]);

  const startRecording = useCallback(() => {
    if (!screenStream) return;

    const detectedMime = getSupportedMimeType();
    setMimeType(detectedMime);
    chunksRef.current = [];

    // Determine which video stream to record
    const videoStream = canvasStreamRef.current || screenStream;

    // Collect all audio tracks from screen capture and microphone
    const screenAudioTracks = screenStream.getAudioTracks();
    const micAudioTracks = micStream?.getAudioTracks() ?? [];
    const allAudioTracks = [...screenAudioTracks, ...micAudioTracks];

    console.log("[Recording] Audio sources:", {
      screenAudio: screenAudioTracks.length,
      micAudio: micAudioTracks.length,
      total: allAudioTracks.length,
    });

    // Mix multiple audio sources using Web Audio API
    let finalAudioTracks: MediaStreamTrack[] = [];

    if (allAudioTracks.length > 1) {
      // Multiple audio sources need mixing into a single track
      try {
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;
        const dest = audioCtx.createMediaStreamDestination();

        for (const track of allAudioTracks) {
          const source = audioCtx.createMediaStreamSource(
            new MediaStream([track])
          );
          source.connect(dest);
        }

        finalAudioTracks = dest.stream.getAudioTracks();
        console.log(
          "[Recording] Mixed",
          allAudioTracks.length,
          "audio tracks into 1"
        );
      } catch (err) {
        console.error("[Recording] Audio mixing failed, using tracks directly:", err);
        finalAudioTracks = allAudioTracks;
      }
    } else {
      finalAudioTracks = allAudioTracks;
    }

    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...finalAudioTracks,
    ]);

    console.log("[Recording] Combined stream:", {
      videoTracks: combinedStream.getVideoTracks().length,
      audioTracks: combinedStream.getAudioTracks().length,
    });

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: detectedMime,
      videoBitsPerSecond: VIDEO_BITRATE,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: detectedMime });
      // Free chunk memory immediately — the blob owns the data now
      chunksRef.current = [];
      console.log("[Recording] Blob created:", (blob.size / (1024 * 1024)).toFixed(1), "MB");
      setRecordedBlob(blob);
      stopTimer();
      setState("STOPPED");
      // Close AudioContext when recording stops
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    pausedDurationRef.current = 0;
    setDuration(0);
    startTimer();
    setState("RECORDING");
  }, [screenStream, micStream, startTimer, stopTimer]);

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
    // Capture thumbnail BEFORE stopping — the stream is still alive
    const thumb = captureThumbnail();
    setRecordedThumbnail(thumb);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    // Streams stay alive until user uploads or discards
  }, [captureThumbnail]);

  const discardRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordedThumbnail(null);
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
    micStream,
    recordedBlob,
    recordedThumbnail,
    duration,
    error,
    mimeType,
    startScreenCapture,
    startWebcam,
    stopWebcam,
    startMicrophone,
    stopMicrophone,
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
