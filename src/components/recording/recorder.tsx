"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useScreenRecorder } from "@/hooks/use-screen-recorder";
import { useMediaDevices } from "@/hooks/use-media-devices";
import { RecordingControls } from "./recording-controls";
import { RecordingTimer } from "./recording-timer";
import { ScreenPreview } from "./screen-preview";
import { WebcamPreview } from "./webcam-preview";
import { WebcamPositionPicker } from "./webcam-position-picker";
import { UploadDialog } from "./upload-dialog";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Video,
} from "lucide-react";
import type { WebcamPosition, Recording } from "@/lib/types";
import { WEBCAM_DEFAULT_SIZE, RECORDING_FPS } from "@/lib/constants";
import { useRouter } from "next/navigation";

export function Recorder() {
  const router = useRouter();
  const {
    state,
    screenStream,
    webcamStream,
    micStream,
    recordedBlob,
    duration,
    error,
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
    setDone,
  } = useScreenRecorder();

  const { cameras, microphones } = useMediaDevices();
  const [includeMic, setIncludeMic] = useState(true);
  const [includeWebcam, setIncludeWebcam] = useState(false);
  const [webcamPosition, setWebcamPosition] =
    useState<WebcamPosition>("bottom-right");
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedMic, setSelectedMic] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const workerRef = useRef<Worker | null>(null);

  // Set up canvas compositor when both streams are ready
  useEffect(() => {
    if (
      state !== "RECORDING" ||
      !includeWebcam ||
      !screenStream ||
      !webcamStream ||
      !canvasRef.current
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    // Create hidden video elements for drawing
    const screenVideo = document.createElement("video");
    screenVideo.srcObject = screenStream;
    screenVideo.muted = true;
    screenVideo.playsInline = true;
    screenVideo.play();
    screenVideoRef.current = screenVideo;

    const webcamVideo = document.createElement("video");
    webcamVideo.srcObject = webcamStream;
    webcamVideo.muted = true;
    webcamVideo.playsInline = true;
    webcamVideo.play();
    webcamVideoRef.current = webcamVideo;

    // Wait for video metadata
    const onReady = () => {
      canvas.width = screenVideo.videoWidth || 1920;
      canvas.height = screenVideo.videoHeight || 1080;

      const canvasStream = canvas.captureStream(RECORDING_FPS);
      setCanvasStream(canvasStream);
    };

    screenVideo.addEventListener("loadedmetadata", onReady);

    // Use Web Worker timer to avoid background tab throttling
    const workerBlob = new Blob(
      [
        `self.onmessage=function(e){setInterval(function(){self.postMessage("tick")},e.data.interval)}`,
      ],
      { type: "application/javascript" }
    );
    const worker = new Worker(URL.createObjectURL(workerBlob));
    workerRef.current = worker;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

      if (webcamVideo.readyState >= 2) {
        const size = WEBCAM_DEFAULT_SIZE;
        const padding = 20;
        let x: number, y: number;

        switch (webcamPosition) {
          case "top-left":
            x = padding;
            y = padding;
            break;
          case "top-right":
            x = canvas.width - size - padding;
            y = padding;
            break;
          case "bottom-left":
            x = padding;
            y = canvas.height - size - padding;
            break;
          default:
            x = canvas.width - size - padding;
            y = canvas.height - size - padding;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(webcamVideo, x, y, size, size);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    worker.onmessage = draw;
    worker.postMessage({ interval: 1000 / RECORDING_FPS });

    return () => {
      worker.terminate();
      workerRef.current = null;
      screenVideo.pause();
      webcamVideo.pause();
    };
  }, [
    state,
    includeWebcam,
    screenStream,
    webcamStream,
    webcamPosition,
    setCanvasStream,
  ]);

  const handleStartCapture = useCallback(async () => {
    const stream = await startScreenCapture();
    if (stream) {
      // Always capture microphone for narration audio
      if (includeMic) {
        await startMicrophone(selectedMic || undefined);
      }
      if (includeWebcam) {
        await startWebcam(selectedCamera || undefined);
      }
    }
  }, [startScreenCapture, startWebcam, startMicrophone, includeWebcam, includeMic, selectedCamera, selectedMic]);

  const handleStartRecording = useCallback(() => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        startRecording();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [startRecording]);

  const toggleMic = useCallback(async () => {
    if (includeMic) {
      stopMicrophone();
      setIncludeMic(false);
    } else {
      setIncludeMic(true);
      if (state === "PREVIEWING") {
        await startMicrophone(selectedMic || undefined);
      }
    }
  }, [includeMic, stopMicrophone, state, startMicrophone, selectedMic]);

  const toggleWebcam = useCallback(async () => {
    if (includeWebcam) {
      stopWebcam();
      setIncludeWebcam(false);
    } else {
      setIncludeWebcam(true);
      if (state === "PREVIEWING") {
        await startWebcam(selectedCamera || undefined);
      }
    }
  }, [includeWebcam, stopWebcam, state, startWebcam, selectedCamera]);

  const handleComplete = useCallback(
    (_recording: Recording) => {
      setDone();
      router.push("/dashboard");
    },
    [setDone, router]
  );

  // IDLE state - show start button
  if (state === "IDLE") {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16">
        <div className="text-center space-y-2">
          <Video className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">New Recording</h1>
          <p className="text-muted">
            Record your screen with optional webcam overlay
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* Microphone toggle */}
          <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
            <span className="text-sm font-medium flex items-center gap-2">
              <Mic className="w-4 h-4" /> Microphone
            </span>
            <button
              onClick={() => setIncludeMic(!includeMic)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                includeMic ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  includeMic ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Mic device selector */}
          {includeMic && microphones.length > 0 && (
            <div className="p-3 bg-surface rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-muted" />
                <select
                  value={selectedMic || ""}
                  onChange={(e) => setSelectedMic(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Webcam toggle */}
          <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
            <span className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" /> Webcam
            </span>
            <button
              onClick={() => setIncludeWebcam(!includeWebcam)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                includeWebcam ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  includeWebcam ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Webcam device selector */}
          {includeWebcam && (
            <div className="p-3 bg-surface rounded-lg border border-border">
              {cameras.length > 0 && (
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-muted" />
                  <select
                    value={selectedCamera || ""}
                    onChange={(e) => setSelectedCamera(e.target.value)}
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
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted">Position:</span>
                <WebcamPositionPicker
                  value={webcamPosition}
                  onChange={setWebcamPosition}
                />
              </div>
            </div>
          )}

          <Button
            size="lg"
            onClick={handleStartCapture}
            className="w-full gap-2"
          >
            <Monitor className="w-5 h-5" />
            Select Screen to Record
          </Button>
        </div>

        {error && (
          <p className="text-danger text-sm">{error}</p>
        )}
      </div>
    );
  }

  // STOPPED state - show upload dialog
  if (state === "STOPPED" && recordedBlob) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <UploadDialog
          blob={recordedBlob}
          duration={duration}
          onComplete={handleComplete}
          onDiscard={discardRecording}
        />
      </div>
    );
  }

  // DONE state - redirecting
  if (state === "DONE") {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted">Redirecting to dashboard...</p>
      </div>
    );
  }

  // PREVIEWING / COUNTDOWN / RECORDING / PAUSED states
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Screen preview with optional webcam overlay */}
      <div className="relative w-full max-w-4xl rounded-xl overflow-hidden bg-black aspect-video">
        <ScreenPreview
          stream={screenStream}
          className="w-full h-full object-contain"
        />
        {includeWebcam && webcamStream && (
          <WebcamPreview
            stream={webcamStream}
            position={webcamPosition}
            size={120}
          />
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-8xl font-bold text-white animate-pulse">
              {countdown}
            </span>
          </div>
        )}
      </div>

      {/* Hidden canvas for compositing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls bar */}
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border">
        {(state === "RECORDING" || state === "PAUSED") && (
          <RecordingTimer duration={duration} state={state} />
        )}

        <RecordingControls
          state={state}
          onStart={handleStartRecording}
          onPause={pauseRecording}
          onResume={resumeRecording}
          onStop={stopRecording}
          onDiscard={discardRecording}
        />

        {state === "PREVIEWING" && (
          <>
            <Button
              variant={includeMic ? "secondary" : "outline"}
              size="icon"
              onClick={toggleMic}
              title={includeMic ? "Mute microphone" : "Unmute microphone"}
            >
              {includeMic ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant={includeWebcam ? "secondary" : "outline"}
              size="icon"
              onClick={toggleWebcam}
              title={includeWebcam ? "Disable webcam" : "Enable webcam"}
            >
              {includeWebcam ? (
                <Camera className="w-5 h-5" />
              ) : (
                <CameraOff className="w-5 h-5" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
