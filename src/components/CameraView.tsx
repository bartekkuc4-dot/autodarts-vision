import { Camera, Video, VideoOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useMotionDetection,
  type MotionConfig,
  type MotionState,
} from "@/hooks/useMotionDetection";

// ─── Status badge config ───────────────────────────────────────────────────────
const STATUS: Record<MotionState, { label: string; color: string; pulse: boolean }> = {
  idle:     { label: "Czuwam",      color: "bg-emerald-500",  pulse: true  },
  motion:   { label: "Ruch!",       color: "bg-yellow-400",   pulse: false },
  cooldown: { label: "Analizuję…",  color: "bg-blue-400",     pulse: true  },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface CameraViewProps {
  /** Called with full-res base64 JPEG when a dart stabilises */
  onFrame?: (base64: string) => void;
  /** Set to false to pause motion detection without stopping the camera */
  isDetectionActive?: boolean;
  motionConfig?: Partial<MotionConfig>;
  /** Notify parent when camera starts / stops */
  onCameraActive?: (active: boolean) => void;
}

const CameraView = ({
  onFrame,
  isDetectionActive = true,
  motionConfig,
  onCameraActive,
}: CameraViewProps) => {
  const [isActive,   setIsActive]   = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Camera control ──────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsStarting(false);
    onCameraActive?.(false);
  }, [onCameraActive]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Ta przeglądarka nie obsługuje kamery.");
      return;
    }
    try {
      setIsStarting(true);
      setError(null);
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width:  { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;

      if (!videoRef.current) throw new Error("Brak elementu video.");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setIsActive(true);
      onCameraActive?.(true);
    } catch (err) {
      stopCamera();
      const message =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Dostęp do kamery został zablokowany."
          : err instanceof Error && err.name === "NotFoundError"
          ? "Nie znaleziono kamery na tym urządzeniu."
          : "Nie udało się uruchomić kamery. Sprawdź uprawnienia przeglądarki.";
      console.error("Camera error:", err);
      setError(message);
    } finally {
      setIsStarting(false);
    }
  }, [stopCamera, onCameraActive]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Motion detection ────────────────────────────────────────────────────────
  const { motionState } = useMotionDetection({
    videoRef,
    isActive: isActive && isDetectionActive && Boolean(onFrame),
    onFrame:  onFrame ?? (() => {}),
    config:   motionConfig,
  });

  const status = STATUS[motionState];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/30">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 h-full w-full object-cover ${isActive ? "block" : "hidden"}`}
      />

      {/* Overlays when camera is active */}
      {isActive && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-primary/10" />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-8 rounded-full border-2 border-primary/40 animate-pulse-neon" />
          <div className="pointer-events-none absolute inset-16 rounded-full border border-primary/20" />

          {/* LIVE badge */}
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1.5 glass-surface">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-neon" />
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
              Live
            </span>
          </div>

          {/* Motion status badge — only when onFrame prop is wired */}
          {onFrame && (
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 glass-surface">
              <div
                className={`h-2 w-2 rounded-full ${status.color} ${status.pulse ? "animate-pulse" : ""}`}
              />
              <span className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
                {status.label}
              </span>
            </div>
          )}
        </>
      )}

      {/* Placeholder when inactive */}
      {!isActive && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <Camera className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="font-body text-sm text-muted-foreground">
            {isStarting ? "Uruchamianie kamery…" : "Kliknij aby uruchomić kamerę"}
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
            <VideoOff className="h-10 w-10 text-destructive" />
          </div>
          <p className="font-body text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={isActive ? stopCamera : startCamera}
        disabled={isStarting}
        className="glass-surface absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full px-6 py-2.5 transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isActive ? (
          <>
            <VideoOff className="h-4 w-4 text-accent" />
            <span className="text-sm font-display font-semibold text-accent">Zatrzymaj</span>
          </>
        ) : (
          <>
            <Video className="h-4 w-4 text-primary" />
            <span className="text-sm font-display font-semibold text-primary">
              {isStarting ? "Łączenie…" : "Uruchom kamerę"}
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default CameraView;
