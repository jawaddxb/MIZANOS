"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/atoms/layout/Dialog";

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
}: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setCaptured(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 640 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopStream();
      setCaptured(null);
      setError(null);
    }
    return stopStream;
  }, [open, startCamera, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    setCaptured(canvas.toDataURL("image/jpeg", 0.9));
    stopStream();
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  const handleUse = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "camera-photo.jpg", {
            type: "image/jpeg",
          });
          onCapture(file);
          onOpenChange(false);
        }
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take Photo</DialogTitle>
          <DialogDescription>
            Position yourself in the frame and click capture.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
          {error ? (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-destructive">
              {error}
            </div>
          ) : captured ? (
            <img
              src={captured}
              alt="Captured"
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
            />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex justify-end gap-2">
          {error ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : captured ? (
            <>
              <Button variant="outline" onClick={handleRetake}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Retake
              </Button>
              <Button onClick={handleUse}>Use Photo</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCapture}>
                <Camera className="h-4 w-4 mr-1" />
                Capture
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
