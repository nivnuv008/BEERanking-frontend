import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

type CameraFacingMode = "user" | "environment";

export type CameraCaptureHandle = {
  closeCamera: () => void;
};

type CameraCaptureRenderProps = {
  isOpen: boolean;
  isReady: boolean;
  preview: ReactNode;
  openCamera: () => void;
  capturePhoto: () => void;
  closeCamera: () => void;
};

type CameraCaptureProps = {
  facingMode: CameraFacingMode;
  fileName: string;
  previewClassName: string;
  onCapture: (file: File) => void;
  onError: (message: string) => void;
  children: (props: CameraCaptureRenderProps) => ReactNode;
};

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  function CameraCapture(
    { facingMode, fileName, previewClassName, onCapture, onError, children },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const stopCameraStream = () => {
      if (!streamRef.current) {
        return;
      }

      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsReady(false);
    };

    const closeCamera = () => {
      stopCameraStream();
      setIsOpen(false);
    };

    useImperativeHandle(ref, () => ({
      closeCamera,
    }));

    useEffect(() => {
      return () => {
        stopCameraStream();
      };
    }, []);

    useEffect(() => {
      if (!isOpen || !videoRef.current || !streamRef.current) {
        return;
      }

      const videoElement = videoRef.current;
      const stream = streamRef.current;

      const markReady = () => {
        if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
          setIsReady(true);
          void videoElement.play();
        }
      };

      setIsReady(false);
      videoElement.srcObject = stream;

      videoElement.addEventListener("loadedmetadata", markReady);
      videoElement.addEventListener("canplay", markReady);
      void videoElement.play().catch(() => {
        // Readiness is still updated by the media events above.
      });

      const readyCheckTimeout = window.setTimeout(markReady, 300);

      return () => {
        window.clearTimeout(readyCheckTimeout);
        videoElement.removeEventListener("loadedmetadata", markReady);
        videoElement.removeEventListener("canplay", markReady);
      };
    }, [isOpen]);

    const openCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        onError("Camera access is not supported in this browser");
        return;
      }

      try {
        stopCameraStream();
        setIsReady(false);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
          },
          audio: false,
        });

        streamRef.current = stream;
        setIsOpen(true);
      } catch (cameraError: unknown) {
        onError(getErrorMessage(cameraError, "Unable to open camera"));
        setIsOpen(false);
        setIsReady(false);
      }
    };

    const capturePhoto = async () => {
      if (!videoRef.current || !canvasRef.current) {
        return;
      }

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;

      if (!width || !height) {
        onError("Camera is not ready yet");
        return;
      }

      canvasElement.width = width;
      canvasElement.height = height;

      const context = canvasElement.getContext("2d");

      if (!context) {
        onError("Unable to capture image from camera");
        return;
      }

      context.drawImage(videoElement, 0, 0, width, height);

      const file = await new Promise<File | null>((resolve) => {
        canvasElement.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }

            resolve(new File([blob], fileName, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.92,
        );
      });

      if (!file) {
        onError("Unable to capture image from camera");
        return;
      }

      onCapture(file);
      closeCamera();
    };

    const preview = isOpen ? (
      <video
        ref={videoRef}
        className={previewClassName}
        autoPlay
        muted
        playsInline
      />
    ) : null;

    return (
      <>
        {children({
          isOpen,
          isReady,
          preview,
          openCamera,
          capturePhoto,
          closeCamera,
        })}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </>
    );
  },
);

export default CameraCapture;
